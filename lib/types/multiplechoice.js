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

        var deferred = Q.defer();

        // @todo - wrap this around a config flag to allow us to ignore validation in prod
        Q.all([
            validateObj_(payload.answerKey, this.answerSchema()),
            validateObj_(payload.studentSubmission, this.submissionSchema())
            ])
        .then(function () {

            // Initialize the returnData object
            var returnData = {};

            // Ensure the student submission is in the answerKey.  This is appropriate
            // for MultipleChoice but perhaps not all assessment types.
            if (!answers[submission]) {
                deferred.reject(new Error('Submission not in answer key'));
            } else {
                deferred.resolve(returnData);
            }

            return deferred.promise;
        })
        .then(function (returnData) {

            // Match the student submission against the answerkey to determine
            // feedback and score
            returnData.correctness = answers[submission].score;
            // @todo - 'response' may end up changing to 'feedback', in which case you'll have to change mock data
            returnData.feedback = answers[submission].response;

            // Dig the correct answer out of the answerKey.  For Multiple Choice that's
            // the answer with score: 1
            // @todo - are people cool with sending 'null' here?
            returnData.correctAnswer = null;
            // @todo - do we want to send the correctAnswer back when the student is correct?  Would that be helpful?
            if (isLastAttempt) {
                var keys = _.keys(answers);
                for (var i = 0; i < keys.length; i++) {
                    if (answers[keys[i]].score === 1) {
                        returnData.correctAnswer = keys[i];
                        break;
                    }
                }
            }

            // @todo - do we also want to return the sequenceNodeKey or is that superfluous?
            callback(null, returnData);
        })
        .catch(function (error) {
            callback(error, null);
        })
        .done();
    };

    /***************************************************************************
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
     ****************************************************************************/
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

};

