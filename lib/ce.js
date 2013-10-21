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
var Q = require('Q');
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

    var that_ = this;

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
        that_.assess(handler, payload, callback);
    };

    /**
     * Receives handler object and payload, checks that answers are formatted correctly, checks 
     * that student submission is formatted correctly, checks correctness,
     * adds correct answer to return obj if appropriate, and fires back callback.
     * 
     * @param  {Object}   payload  The same object passed into the CE, containing
     *                             answerKey, studentSubmission, and isLastAttempt.
     * @param  {Function} callback Callback with signature fn(error, results),
     *                             containing correctness, feedback, and 
     *                             optionally correctAnswer
     */
    this.assess = function(handler, payload, callback)
    {
        var answers = payload.answerKey.answers;
        var submission = payload.studentSubmission.submission;
        var isLastAttempt = payload.isLastAttempt;

        // @todo - wrap this around a config flag to allow us to ignore validation in prod
        Q.all([
            handler.validateObj(payload.answerKey, handler.answerSchema()),
            handler.validateObj(payload.studentSubmission, handler.submissionSchema())
            ])
        .then(function () {

            // Initialize the returnData object
            var returnData = {};

            // Preprocess function on answers, submission, and returnData.
            return handler.preprocess(answers, submission, returnData);
        })
        .then(function (returnData) {
            // Add the score and feedback to returnData
            return handler.calculateScoreAndFeedback(answers, submission, returnData);
        })
        .then(function (returnData) {
            // Add the correct answer to returnData if appropriate
            return handler.addCorrectAnswer(answers, isLastAttempt, returnData);
        })
        .then(function (returnData) {
            // @todo - do we also want to return the sequenceNodeKey or is that superfluous?
            callback(null, returnData);
        })
        .catch(function (error) {
            callback(error, null);
        })
        .done();
    };
};