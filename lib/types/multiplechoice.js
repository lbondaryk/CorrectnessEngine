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
 * @todo - Some of these methods should either be abstracted out to a base
 * class or put into a /types/typeUtils.js module (I'm looking at you, 
 * validateObj) once we have another assessment type that would use the 
 * same method.
 *
 * **************************************************************************/
var config = require('config');
var Q = require('q');
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
function AssessmentHandler()
{
    // @todo - I think there's a logger implementation bug somewhere...I don't think
    // each individual file should be creating their own logger, which seems to be
    // happening.
    var logger = utils.getLogger(config, 'multiplechoice');

    /**
     * schema for answers.
     * @return {Object} schema for answers
     */
    this.answerSchema = function()
    {
        return {
            "$schema": "http://pearson.com/brix/multiplechoice/answerkey/0.1/schema#",
            "title": "Brix Multiple Choice AnswerKey",
            "description": "The answer key used to determine the correctness of a student's multiple choice selection, and the feedback for their answer",
            "type": "object",
            "required": ["assessmentType", "answers"],
            "properties":
            {
                "assessmentType":
                    {
                        "description": "identifies this answer key as being for a multiple choice type question",
                        "type": "string",
                        "enum": ["multiplechoice"]
                    },
                "answers":
                    {
                        "description": "the feedback and score of all possible choices for this multiple choice question indexed by the choice key value",
                        "type": "object",
                        "additionalProperties":
                            {
                                "type": "object",
                                "required": ["score", "response"],
                                "properties":
                                    {
                                        "score":
                                            {
                                                "description": "A number between 0 and 1 where 0 is incorrect and 1 is correct",
                                                "type": "number",
                                                "minimum": 0,
                                                "maximum": 1
                                            },
                                        "response":
                                            {
                                                "description": "The feedback for the student who selected this answer",
                                                "type": "string"
                                            }
                                    }
                            }
                    },
                "nonRecordable":
                    {
                        "description": "A flag that denotes whether the assessment should be recorded in PAF",
                        "type": "boolean"
                    },
                "description":
                    {
                        "description": "A descriptive comment about this answer key",
                        "type": "string"
                    }
            }
        };
    };

    /**
     * schema for submission.
     * @return {Object} schema for submission
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
     * Validates an obj against the schema
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
    this.validateObj = function(obj, schema)
    {
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
    };

    /**
     * Preprocessing
     *  
     * Abstracted so answers, studentSubmission, and/or returnData stub can 
     * be manipulated prior to further processing if need be.
     * 
     * For multiplechoice this checks to make sure the submission key is 
     * present within the answer key.
     * 
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @param  {Object} returnData        returnData object stub
     * @return {Promise}                  the returnData object stub
     */
    this.preprocess = function(answerKey, studentSubmission, returnData)
    {
        var deferred = Q.defer();

        // Ensure the student submission is in the answerKey.
        if (!answerKey.answers[studentSubmission.submission]) {
            deferred.reject(new Error('Submission not in answer key'));
        } else {
            deferred.resolve(returnData);
        }

        return deferred.promise;
    };

     /**
     * Calculate score and feedback
     *
     * For multiple choice score and feedback calculation go hand in hand.  For 
     * other assessment types we may want to break those out from here.
     * 
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @param  {Object} returnData        returnData object stub
     * @return {Promise}                  the returnData object with score and feedback attached
     */
    this.calculateScoreAndFeedback = function(answerKey, studentSubmission, returnData)
    {
        var deferred = Q.defer();
        var answers = answerKey.answers;
        var submission = studentSubmission.submission;

        // Match the student submission against the answerkey to determine
        // feedback and score
        returnData.correctness = answers[submission].score;
        // @todo - 'response' may end up changing to 'feedback', in which case we'll have to change mock data
        returnData.feedback = answers[submission].response;

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Calculate the correct answer if appropriate.  For Multiple Choice that's
     * the answer with score: 1
     *
     * @param {Object}  answerKey     contains the answers
     * @param {boolean} isLastAttempt whether this is the student's last attempt or not
     * @param {Promise} returnData    returnData with correctAnswer attached
     */
    this.addCorrectAnswer = function(answerKey, isLastAttempt, returnData)
    {
        var deferred = Q.defer();
        var answers = answerKey.answers;

        // By default send null here (not an empty object)
        returnData.correctAnswer = null;
        // Send correct answer when it's the last attempt and they're not correct
        if (isLastAttempt && returnData.correctness !== 1) {
            var keys = _.keys(answers);
            for (var i = 0; i < keys.length; i++) {
                if (answers[keys[i]].score === 1) {
                    returnData.correctAnswer = {
                        "key": keys[i],
                        "feedback": answers[keys[i]].response
                    };

                    deferred.resolve(returnData);
                    break;
                }
            }
        } else {
            deferred.resolve(returnData);
        }
        return deferred.promise;
    };
}

/**
 * Export createAssessmentHandler.  Every Assessment Handler should export this though
 * the details within can vary by assessment type.
 * @param  {Object} options For creation options
 * @return {Object}         AssessmentHandler object
 */
module.exports.createAssessmentHandler = function createAssessmentHandler(options)
{
    return new AssessmentHandler(options);
};


