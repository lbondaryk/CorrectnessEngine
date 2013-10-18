/* **************************************************************************
 * $Workfile:: multiplechoice.js                                            $
 * *********************************************************************/ /**
 *
 * @fileoverview The multiplechoice assessmentType is managed herein.
 *
 * Created on       Oct 15, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
var config = require('config');
var Q = require('Q');
var ZSchema = require('z-schema');
var _ = require('underscore');
var utils = require('../utils');


/* **************************************************************************
 * multiplechoice class                                                */ /**
 *
 * @constructor
 *
 * @classdesc
 * Assesses multiple choice questions. 
 *
 ****************************************************************************/
module.exports.AssessmentHandler = function() {

    // @todo - I think there's a logger implementation bug somewhere...I don't think
    // each individual file should be creating their own logger, which seems to be
    // happening.
    var logger = utils.getLogger(config, 'multiplechoice');

    var that_ = this;

    /**
     * schema for answers.
     * @return {object} schema for answers
     */
    // @todo - this is incomplete.  if we want to beef it up at some point we can.
    this.answerSchema = function()
    {
        return {
            "$schema": "http://pearson.com/brix/multiplechoice/answerkey/0.1/schema#",
            "title": "Brix Multiple Choice AnswerKey",
            "description": "AnswerKey",
            "type": "object",
            "properties": {
                "assessmentType": {
                    "description": "The type of assessment",
                    "type": "string"
                    },
                "answers": {
                    "description": "The object containing the answers",
                    "type": "object"
                    }
            },
            "required": ["assessmentType", "answers"]
        };
    };

    /**
     * schema for submission.
     * @return {object} schema for submission
     */
    // @todo - I'm not sure about this format: {studentSubmission.submission."submission string"}.  
    // We should all talk about it.
    this.submissionSchema = function()
    {
        return {
             "$schema": "http://pearson.com/brix/multiplechoice/studentsubmission/0.1/schema#",
            "title": "Brix Multiple Choice Student Submission",
            "description": "Student Submission",
            "type": "object",
            "properties": {
                "submission": {
                    "description": "submission key matching individual answer key",
                    "type": "string"
                    }
            },
            "required": ["submission"]
        };
    };


    /**
     * Receives payload, checks that answers are formatted correctly, checks 
     * that student submission is formatted correctly, checks correctness,
     * adds correct answer to return obj if appropriate, and fires back callback.
     * 
     * @param  {[type]}   payload  The same object passed into the CE, containing
     *                             answerKey, studentSubmission, and isLastAttempt.
     * @param  {Function} callback Callback with signature fn(error, results),
     *                             containing correctness, feedback, and 
     *                             optionally correctAnswer
     */
    this.assess = function(payload, callback) {
        var answers = payload.answerKey.answers;
        var submission = payload.studentSubmission.submission;
        var isLastAttempt = payload.isLastAttempt;

        // @todo - wrap this around a config flag to allow us to ignore validation in prod
        Q.all([
            validateObj_(payload.answerKey, this.answerSchema()),
            validateObj_(payload.studentSubmission, this.submissionSchema())
            ])
        .then(function () {

            // Initialize the returnData object
            var returnData = {};

            // Preprocess function on answers, submission, and returnData.
            return preprocess_(answers, submission, returnData);
        })
        .then(function (returnData) {
            // Add the score and feedback to returnData
            return calculateScoreAndFeedback_(answers, submission, returnData);
        })
        .then(function (returnData) {
            // Add the correct answer to returnData if appropriate
            return addCorrectAnswer_(answers, isLastAttempt, returnData);
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

    /**
     * Validates an obj against the schema
     * @private
     *
     * @param {Object} obj   The JSON object to validate against the schema.
     * @param {Object} schema    The JSON object that represents the schema.
     *
     * @return {Promise}  The object that represents the outcome of this asynch 
     *                    operation.
     *                    The successful data of the promise callback contains
     *                    the validation report (saying valid = true).
     *
     */
    function validateObj_(obj, schema) {
        var deferred = Q.defer();

        ZSchema.validate(obj, schema, function(err, report) {
            if (err) {
                logger.error('multiplechoice scheme validation error.', err);
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }

    /**
     * Preprocessing.
     * @private
     *  
     * Abstracted so answers, submission, and/or returnData stub can 
     * be manipulated prior to further processing if need be.
     * 
     * For multiplechoice this checks to make sure the submission key is 
     * present within the answer key.
     * 
     * @param  {Object} answers    contains the answers
     * @param  {Object} submission contains the student submission
     * @param  {Object} returnData returnData object stub
     * @return {Promise}           the returnData object stub
     */
    function preprocess_(answers, submission, returnData) {
        var deferred = Q.defer();

        // Ensure the student submission is in the answerKey.
        if (!answers[submission]) {
            deferred.reject(new Error('Submission not in answer key'));
        } else {
            deferred.resolve(returnData);
        }

        return deferred.promise;
    }

     /**
     * Calculate score and feedback
     * @private
     *
     * For multiple choice score and feedback calculation go hand in hand.  For 
     * other assessment types we may want to break those out from here.
     * 
     * @param  {Object} answers    contains the answers
     * @param  {Object} submission contains the student submission
     * @param  {Object} returnData returnData object stub
     * @return {Promise}           the returnData object with score and feedback attached
     */
    function calculateScoreAndFeedback_(answers, submission, returnData) {
        var deferred = Q.defer();

        // Match the student submission against the answerkey to determine
        // feedback and score
        returnData.correctness = answers[submission].score;
        // @todo - 'response' may end up changing to 'feedback', in which case we'll have to change mock data
        returnData.feedback = answers[submission].response;

        deferred.resolve(returnData);
        return deferred.promise;
    }

    /**
     * Dig the correct answer out of the answerKey.  For Multiple Choice that's
     * the answer with score: 1
     * @private
     *
     * @param {Object}  answers       contains the answers
     * @param {Boolean} isLastAttempt whether this is the student's last attempt or not
     * @param {Promise} returnData    returnData with correctAnswer attached
     */
    function addCorrectAnswer_(answers, isLastAttempt, returnData) {
        var deferred = Q.defer();

        // @todo - are people cool with sending 'null' here?
        returnData.correctAnswer = null;
        // @todo - do we want to send the correctAnswer back when the student is correct?  Would that be helpful?
        // If so we probably need a refactor here.
        if (isLastAttempt) {
            var keys = _.keys(answers);
            for (var i = 0; i < keys.length; i++) {
                if (answers[keys[i]].score === 1) {
                    returnData.correctAnswer = keys[i];
                    deferred.resolve(returnData);
                    break;
                }
            }
        } else {
            deferred.resolve(returnData);
        }
        return deferred.promise;
    }
};

