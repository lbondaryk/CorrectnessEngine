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
    'alwayscorrect': require('./types/alwayscorrect'),
    'multiplechoice': require('./types/multiplechoice')
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
module.exports.EngineHandler = function()
{

    var logger = utils.getLogger(config, 'ce');

    /**
     * Receives a payload from the controller, containing answerKey,  
     * studentSubmission, and isLastAttempt, and farms that out to the 
     * appropriate answerType hander.
     * If isLastAttempt the handler will also return the correctAnswer.
     * Handlers return correctness, feedback, and correctAnswer, as appropriate.
     * 
     * @param  {Object}   payload  An object containing the data payload.
     * @param  {Function} callback Callback with signature fn(error, results),
     *                             where results will contain correctness,
     *                             feedback, and correctAnswer
     */
    this.processSubmission = function(payload, callback)
    {
        var assessmentType = payload.answerKey.assessmentType;
        if (!(assessmentType in assessmentHandlers))
        {
            callback("The assessmentType '" + assessmentType + "' can not be processed by this Correctness Engine", null);
            return;
        }
        
        var handler = assessmentHandlers[assessmentType].createAssessmentHandler();
        this.assess(handler, payload, callback);
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
    this.assess = function(handler, payload, callback)
    {
console.log("----> payload");
console.log(JSON.stringify(payload));
        var answerKey = payload.answerKey;
        var studentSubmission = payload.studentSubmission;

        Q.fcall(function() {
            if (!config.validateSchema) {
                return;
            } else {
                // perform validation
                return Q.all([
                    handler.validateObj(answerKey, handler.answerSchema()),
                    handler.validateObj(studentSubmission, handler.submissionSchema())
                ]);
            }
        })
        .then(function () {

            // Initialize the returnData object
            var returnData = {};
             
            // Preprocess function on answerKey, studentSubmission, and returnData.
            return handler.preprocess(returnData, answerKey, studentSubmission);
        })
        .then(function (returnData) {
            // Add the score and feedback to returnData
            return handler.calculateScoreAndFeedback(returnData, answerKey, studentSubmission);
        })
        .then(function (returnData) {
            // Add the stats data.  Typically this will just be the key or string that the
            // student submitted but we're segregating here in case it's more complicated
            // for some assessment type
            return handler.calculateStats(returnData, studentSubmission);
        })
        .then(function (returnData) {
            // Add the correct answer to returnData if appropriate
            return handler.addCorrectAnswer(returnData, answerKey, payload.isLastAttempt);
        })
        .then(function (returnData) {
            callback(null, returnData);
        })
        .catch(function (error) {
            callback(error, null);
        })
        .done();
    };
};