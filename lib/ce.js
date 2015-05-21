/* **************************************************************************
 * $Workfile:: ce.js                                                        $
 * *********************************************************************/ /**
 *
 * @fileoverview ce contains the handler for the controller route.
 *               It takes the full payload from the IPS and farms that out
 *               to the appropriate assessmentHandler, handing return 
 *               data back to the controller, including correctness,
 *               feedback, and correctAnswer (as appropriate).
 *
 * Created on       Oct 11, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
var config = require('config');
var Q = require('q');
var utils = require('./utils');

// assessmentType Handlers
// NOTE: We could consider using https://npmjs.org/package/require.async to load these 
// instead.  I'm not sure what the performance implications are.
// Alternately we may be able to use an index file instead if that's easier.
var assessmentHandlers = {
    'alwayscorrect':       require('./types/alwayscorrect'),
    'discussions':         require('./types/discussions'),
    'multiplechoice':      require('./types/multiplechoice'),
    'multivalue':          require('./types/multivalue'),
    'numeric':             require('./types/numeric'),
    'programmingexercise': require('./types/programmingexercise')
};


/* **************************************************************************
 * EngineHandler class                                                 */ /**
 *
 * @constructor
 *
 * @classdesc
 * The EngineHandler exposes a processSubmission method to handle
 * student submissions, routing them to the appropriate assessment
 * handler. 
 *
 ****************************************************************************/
module.exports.EngineHandler = function ()
{
    var logger = utils.getLogger(config, 'ce');

    /**
     * Create an assessment handler for the given request context.
     *
     * @private
     * @param {string} assessmentType
     * @param {!Object} headers
     *      The header information for the request. Should contain the user and
     *      course Ids.
     *
     * @returns {Promise} A promise whose resolved value is an assessment handler
     *      instance for the request.
     */
    var createAssessmentHandler = function createAssessmentHandler(assessmentType, headers)
    {
        var deferred = Q.defer();

        try
        {
            if (!(assessmentType in assessmentHandlers))
            {
                deferred.reject("The assessmentType '" + assessmentType + "' can not be processed by this Correctness Engine");
                return deferred.promise;
            }

            var options =
                {
                    context:
                    {
                        userId: headers['pi-id'],
                        courseId: headers['course-id']
                    }
                };

            var handler = assessmentHandlers[assessmentType].createAssessmentHandler(options);

            deferred.resolve(handler);
        }
        catch (e)
        {
            deferred.reject(e);
        }

        return deferred.promise;
    };

    /**
     * Receives a request context from the controller, containing header info and a
     * payload that should have answerKey, studentSubmission, and isLastAttempt, and
     * farms that out to the appropriate answerType handler.
     * If isLastAttempt the handler will also return the correctAnswer.
     * Handlers return correctness, feedback, and correctAnswer, as appropriate.
     * 
     * @param {Object} requestContext
     *      An object containing the data payload.
     *
     * @param {Function} callback
     *      Callback with signature fn(error, results), where results will contain
     *      correctness, feedback, and correctAnswer
     */
    this.processSubmission = function (requestContext, callback)
    {
        createAssessmentHandler(requestContext.payload.answerKey.assessmentType, requestContext.headers)
            .then(function (handler)
                {
                    return Q.fcall(this.assess, handler, requestContext.payload, callback);
                }.bind(this))
            .catch(function (error)
                {
                    callback(error, null);
                });
    };

    /**
     * Receives handler object and payload, checks that answers are formatted correctly, checks 
     * that student submission is formatted correctly, checks correctness,
     * adds correct answer to return obj if appropriate, and fires back callback.
     * 
     * @param  {AssessmentHandler}
     *                    handler  The handler for the type of assessment in the payload
     * @param  {Object}   payload  The same object passed into the CE, containing
     *                             answerKey, studentSubmission, and isLastAttempt.
     * @param  {Function} callback Callback with signature fn(error, results),
     *                             containing correctness, feedback, and 
     *                             optionally correctAnswer
     */
    this.assess = function (handler, payload, callback)
    {
        var answerKey = payload.answerKey;
        var studentSubmission = payload.studentSubmission;

        var validations = [];
        if (config.validateSchema)
        {
            validations.push(handler.validateObj(answerKey, handler.answerSchema()));
            validations.push(handler.validateObj(studentSubmission, handler.submissionSchema()));
        }

        Q.all(validations)
            .then(function ()
                {
                    // Initialize the returnData object
                    var returnData = {};
                    // Preprocess function on answerKey, studentSubmission, and returnData.
                    return handler.preprocess(returnData, answerKey, studentSubmission);
                })
            .then(function (returnData)
                {
                    // Add the score and feedback to returnData
                    return handler.calculateScoreAndFeedback(returnData, answerKey, studentSubmission);
                })
            .then(function (returnData)
                {
                    // Add the stats data.  Typically this will just be the key or string that the
                    // student submitted but we're segregating here in case it's more complicated
                    // for some assessment type
                    return handler.calculateStats(returnData, studentSubmission);
                })
            .then(function (returnData)
                {
                    // Add the correct answer to returnData if appropriate
                    return handler.addCorrectAnswer(returnData, answerKey, payload.isLastAttempt);
                })
            .then(function (returnData)
                {
                    callback(null, returnData);
                })
            .catch(function (error)
                {
                    callback(error, null);
                })
            .done();
    };

    /**
     * Receives an answerKey payload from the controller  
     * and farms that out to the appropriate answerType handler to dig
     * out the correct answer to return.
     * 
     * @param {Object} requestContext
     *      An object containing the data payload.
     *
     * @param {Function} callback
     *      Callback with signature fn(error, results), where results will contain
     *      correctAnswer
     */
    this.retrieveAnswer = function (requestContext, callback)
    {
        var answerKey = requestContext.payload;

        createAssessmentHandler(answerKey.assessmentType, requestContext.headers)
            .then(function (handler)
                {
                    var validations = [];
                    if (config.validateSchema)
                    {
                        validations.push(handler.validateObj(answerKey, handler.answerSchema()));
                    }

                    return Q.all(validations).then(function () { return handler; });
                })
            .then(function (handler)
                {
                    // Initialize the returnData object
                    var returnData = {};
                    // Dig the correct answer out of the answerKey
                    return handler.retrieveCorrectAnswer(returnData, answerKey);
                })
            .then(function (returnData)
                {
                    callback(null, returnData);
                })
            .catch(function (error)
                {
                    callback(error, null);
                })
            .done();
    };
};
