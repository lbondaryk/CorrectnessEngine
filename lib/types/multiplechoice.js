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
                    "type": "array"
                    }
            },
            "required": ["assessmentType", "answers"]
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
     * For multiplechoice this is just a passthrough.
     * 
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @param  {Object} returnData        returnData object stub
     * @return {Promise}                  the returnData object stub
     */
    this.preprocess = function(answerKey, studentSubmission, returnData)
    {
        var deferred = Q.defer();
        deferred.resolve(returnData);
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

        // Match the student submission against the answerkey to determine
        // feedback and score
        for (var i = 0; i < answers.length; i++) {
            if (answers[i].key === studentSubmission.submission) {
                returnData.correctness = answers[i].score;
                // @todo - 'response' may end up changing to 'feedback', in which case we'll have to change mock data
                returnData.feedback = answers[i].response;

                deferred.resolve(returnData);
                break;
            }
        }
        if (!returnData.correctness) {
            deferred.reject(new Error('Submission not in answer key'));
        }

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

        // @todo - are people cool with sending 'null' here?
        returnData.correctAnswer = null;
        // @todo - do we want to send the correctAnswer back when the student is correct?  Would that be helpful?
        // If so we probably need a refactor here.  If student is correct and isLastAttempt we send correctAnswer
        // which may also not be appropriate/necessary.
        if (isLastAttempt) {
            for (var i = 0; i < answers.length; i++) {
                if (answers[i].score === 1) {
                    returnData.correctAnswer = answers[i].key;
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


