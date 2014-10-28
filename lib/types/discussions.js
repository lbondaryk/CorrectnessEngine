/* **************************************************************************
 * $Workfile:: discussions.js                                               $
 * *********************************************************************/ /**
 *
 * @fileoverview An assessmentType for types that use the GRID Discussions
 * API, including Journal and Shared Writing
 *
 * Created on       Oct 27, 2014
 * @author          Seann Ives
 *
 * @copyright (c) 2014 Pearson, All rights reserved.
 *
 * **************************************************************************/
var config = require('config');
var Q = require('q');
var ZSchema = require('z-schema');
var _ = require('underscore');
var utils = require('../utils');


/* **************************************************************************
 * discussions class                                                   */ /**
 *
 * @constructor
 *
 * @classdesc
 * Always returns correct and returns an indicator to the IPS that there
 * should be additional calls made to the GRID Discussions API.
 *
 ****************************************************************************/
function AssessmentHandler()
{
    var logger = utils.getLogger(config, 'discussions');

    /**
     * schema for answers.
     * @return {Object} schema for answers
     */
    this.answerSchema = function()
    {
        return {
            "$schema": "http://pearson.com/brix/programmingexercise/answerkey/0.1/schema#",
            "title": "Brix Discussions AnswerKey",
            "description": "The answer key used to indicate that this is a Discussions assessment",
            "type": "object",
            "required": ["assessmentType", "answers"],
            "properties":
            {
                "assessmentType":
                    {
                        "description": "identifies this answer key as being for a discussions type question",
                        "type": "string",
                        "enum": ["discussions"]
                    },
                "answers":
                    {
                        "description": "parameters from the answerKey needed to be passed back to the IPS and IPC",
                        "type": "object",
                        "required": ["topicId", "authorId"],
                        "properties":
                        {
                            "topicId":
                                {
                                    "description": "The topicId for this Discussion",
                                    "type": "string"
                                },
                            "authorId":
                                {
                                    "description": "The authorId for this Discussion Post",
                                    "type": "string"
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
     * schema for submission.  Discussions submissions is just a string of the student's code.
     * @return {Object} schema for submission
     */
    this.submissionSchema = function()
    {
        return {
            "$schema": "http://pearson.com/brix/discussions/studentsubmission/0.2/schema#",
            "title": "Brix Discussions Student Submission",
            "description": "Student Submission",
            "type": "object",
            "properties": {
                "entry": {
                    "description": "submission",
                    "type": "string"
                    }
            },
            "required": ["entry"]
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
                logger.error('programmingexercise scheme validation error.', err);
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
     * be manipulated prior to further processing if need be.  Unused for
     * this discussions type.
     * 
     * There's nothing to do with ProgrammingExercise so this is just a pass-thru.
     * 
     * @param  {Object} returnData        returnData object stub
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @return {Promise}                  the returnData object stub
     */
    this.preprocess = function(returnData, answerKey, studentSubmission)
    {
        var deferred = Q.defer();

        deferred.resolve(returnData);

        return deferred.promise;
    };

     /**
     * Calculate score and feedback
     *
     * This will always be correct.  Add discussions boolean so IPS knows this is
     * discussions and authorId and topicId passed in from the answerKey.
     * 
     * @param  {Object} returnData        returnData object stub
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @return {Promise}                  the returnData object with score and feedback attached
     */
    this.calculateScoreAndFeedback = function(returnData, answerKey, studentSubmission)
    {
        var deferred = Q.defer();

        returnData.correctness = 1;
        returnData.feedback = "You are correct.";
        returnData.discussions = true;
        returnData.authorId = answerKey.answers.authorId;
        returnData.topicId = answerKey.answers.topicId;

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
    * Calculate stats
    *
    * Add data destined for the TinCan statement sent to DAALT for stats.
    * 
    * For discussions, we want the student's submission (itemResponseText)
    * and the DAALT categorization of this assessment type ("SimpleWriting").
    * 
    * @param  {Object} returnData        returnData object
    * @param  {Object} studentSubmission contains the student submission
    * @return {Object}                   the returnData object with stats attached
    */
    this.calculateStats = function(returnData, studentSubmission)
    {
        var deferred = Q.defer();
        returnData.stats = {};

        returnData.stats.answerId = null;
        returnData.stats.itemResponseText = studentSubmission.entry;
        returnData.stats.assessmentItemQuestionType = "SimpleWriting";

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Stub method, just passing along returnData
     * 
     * @param  {Object} returnData        returnData object
     * @return {Object} returnData
     */
    this.addCorrectAnswer = function(returnData, answerKey, isLastAttempt)
    {
        var deferred = Q.defer();
        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Retrieve the correct answer.
     * For Discussions that's a null value.
     *
     * @param {Object}  returnData    returnData with correctAnswer attached
     * @param {Object}  answerKey     contains the answers
     */
    this.retrieveCorrectAnswer = function(returnData, answerKey)
    {
        var deferred = Q.defer();

        returnData.correctAnswer = null;
        deferred.resolve(returnData);
        
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