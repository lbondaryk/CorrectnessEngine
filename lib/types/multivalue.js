/* **************************************************************************
 * $Workfile:: multivalue.js                                                $
 * *********************************************************************/ /**
 *
 * @fileoverview The multivalue assessmentType is managed herein.
 *
 * Created on       Sep 30, 2014
 * @author          Seann Ives
 *
 * @copyright (c) 2014 Pearson, All rights reserved.
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
 * multivalue class                                                    */ /**
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
    var logger = utils.getLogger(config, 'multivalue');

    /**
     * schema for answers.
     * @return {Object} schema for answers
     */
    this.answerSchema = function()
    {
        return {
            "$schema": "http://pearson.com/brix/multivalue/answerkey/0.1/schema#",
            "title": "Brix MultiValue AnswerKey",
            "description": "The answer key used to determine the correctness of a student's multivalue selection, and the feedback for their answer",
            "type": "object",
            "required": ["assessmentType", "answers"],
            "properties":
            {
                "assessmentType":
                    {
                        "description": "identifies this answer key as being for a mulitvalue type question",
                        "type": "string",
                        "enum": ["multivalue"]
                    },
                "answers":
                    {
                        "description": "the correct key values and feedback for when the submitted answer is correct and incorrect.",
                        "type": "object",
                        //@todo - when you do the feedback story, you may want to add these back in here, or perhaps 
                        // correctFeedback and incorrectFeedback may change, in which case remove or change them below.
                        //"required": ["correctValues", "correctFeedback", "incorrectFeedback"], or some are optional?
                        //what about "correctResponse"?
                        "required": ["correctValues"],
                        "properties":
                            {
                                "correctValues":
                                    {
                                        "description": "The sets of values for keys any one of which if matched makes the answer correct",
                                        "type": "array",
                                        "items":
                                        {
                                            "description": "The multiple keys of this question and the associated correct values for those keys",
                                            "type": "object",
                                            "additionalProperties":
                                                {
                                                    "anyOf":
                                                        [
                                                            { "type": "string" },
                                                            { "type": "number" },
                                                            { "type": "boolean" }
                                                        ]
                                                }
                                        }
                                    },
                                "correctFeedback":
                                    {
                                        "description": "The feedback for the student who answered correctly",
                                        "type": "string"
                                    },
                                "incorrectFeedback":
                                    {
                                        "description": "The feedback for the student who answered incorrectly",
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
     * schema for submission.
     * @return {Object} schema for submission
     */
    this.submissionSchema = function()
    {
        return {
            "$schema": "http://pearson.com/brix/multivalue/studentsubmission/0.2/schema#",
            "title": "Brix Multiple Choice Student Submission",
            "description": "Student Submission",
            "type": "object",
            "additionalProperties":
            {
                "description": "property name is the answerKey, the value is the submitted value for that key",
                "type": ["string", "number", "boolean"]
            }
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
                logger.error('multivalue scheme validation error.', err);
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
     * For multivalue this does nothing.
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
     * For multiple choice score and feedback calculation go hand in hand.  For 
     * other assessment types we may want to break those out from here.
     * 
     * @param  {Object} returnData        returnData object stub
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @return {Promise}                  the returnData object with score and feedback attached
     */
    this.calculateScoreAndFeedback = function(returnData, answerKey, studentSubmission)
    {
        var deferred = Q.defer();
        var questionSolution = answerKey.answers;

        // Assume answer is incorrect
        returnData.correctness = 0;
        returnData.feedback = (questionSolution['incorrectResponse']);

        // if answer is correct, update returnData to reflect that

        // To be correct the submission must have only the keys contained in the
        // solution, and the submitted keys must have identical values to the keys
        // in the solution.
        var submittedKeys = _.keys(studentSubmission);
        var correctValues = questionSolution['correctValues'];
        var isCorrectAnswer = correctValues.some(    
                function (correctValueSet)
                {
                    var solutionKeys = _.keys(correctValueSet);

                    if (solutionKeys.length !== submittedKeys.length)
                    {
                        return false;
                    }
                    return solutionKeys.every(function (key) { return studentSubmission[key] === correctValueSet[key]; });
                });

        if (isCorrectAnswer)
        {
            returnData['correctness'] = 1;
            returnData['feedback'] = questionSolution['correctResponse'];
        }
        else
        {
            // Feedback on correctness of individual submitted key values
            // against 1st correct key value set.
            // This goes into the brixState object, as it's an assessment-specific
            // property that the IPS doesn't need to know about but does need
            // to hand back to the client and save in NodeResults.
            
            var correctValueSet = correctValues[0];
            var keyValueFeedback = {};
            submittedKeys.forEach(function (key) { keyValueFeedback[key] = (studentSubmission[key] === correctValueSet[key]); });
            
            returnData.brixState = {};
            returnData.brixState.keyValueFeedback = keyValueFeedback;
        }

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
    * Calculate stats
    *
    * Add data destined for the TinCan statement sent to DAALT for stats.  It wants
    * either an "answerId" (a key) or a "response" (a string) of what the student 
    * submitted.
    * 
    * For multiple choice, we want to pass just the answer key along in "answerId".  
    * Rather than { "key": "answer4" } we just want "answer4".
    * "response" is null.
    * 
    * @param  {Object} returnData        returnData object stub
    * @param  {Object} studentSubmission contains the student submission
    * @return {Promise}                  the returnData object with score and feedback attached
    */
    this.calculateStats = function(returnData, studentSubmission)
    {
        var deferred = Q.defer();
        returnData.stats = {};

        /** TinCan 1.0 properties {{ */
        returnData.stats.assessmentItemQuestionType = "MultiValue";

        // @todo - this will all have to change when we do the update mcq's and this tincan stuff.
        returnData.stats.answerId = null;
        returnData.stats.response = null;
        /** }} TinCan 1.0 */

        /** TinCan 2.0, context.extensions part:
         * @see https://devops-tools.pearson.com/stash/projects/DAALT_REF/repos/schemas/browse/src/main/resources/seer/tincan/Multi_Value_Question_User_Answered.Schema.json?at=v2.0.1
         *
         * It does not include properties 
         * Assessment_Source_System_Record_Id, Assessment_Source_System_Code
         * Assessment_Item_Source_System_Record_Id, Assessment_Item_Source_System_Code
         * which are set in IPS's 
         * DataAnalyticsHelper.buildMessage at DefaultFlowStrategy.buildSubmissionAnalyticsData_:
         */
        returnData.stats.typeCode = 'Multi_Value_Question_User_Answered';
        var responseCode = (returnData.correctness) ? 'Correct' : 'Incorrect';
        
        var tinCanStudentResponse = [];

        // Iterate through the student submission to build the TinCan 2.0's 
        // Student_Response part
        // NOTICE that it is providing only those targets that students has 
        // provided (selected)
        for (var key in studentSubmission)
        {
            // When all values are correct, then there is no returnData.brixState
            var subResponseCode = responseCode;
            if (returnData.brixState && _.isObject(returnData.brixState.keyValueFeedback))
            {
                subResponseCode = (returnData.brixState.keyValueFeedback[key]) ? 'Correct' : 'Incorrect';
            }

            // Normalize to string type
            var targetId = studentSubmission[key].toString();
            tinCanStudentResponse.push({
                Target_Id: targetId, // @todo - what shall put here??
                Answer_Id: key,
                Target_Sub_Question_Response_Code: subResponseCode
            });
        }

        returnData.stats.extensions =
            {
                Assessment_Item_Question_Type: 'MultiValue',
                Assessment_Item_Response_Code: responseCode,
                Student_Response: tinCanStudentResponse
            };

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Calculate the correct answer if appropriate.  For Multivalue that's
     * the stuff in answerKey.answers.correctValues, or at least the first thing in that
     * array.
     *
     * @param {Promise} returnData    returnData with correctAnswer attached
     * @param {Object}  answerKey     contains the answers
     * @param {boolean} isLastAttempt whether this is the student's last attempt or not
     */
    this.addCorrectAnswer = function(returnData, answerKey, isLastAttempt)
    {
        var deferred = Q.defer();
        var answers = answerKey.answers;

        // By default send null here (not an empty object)
        returnData.correctAnswer = null;
        // Send correct answer when it's the last attempt and they're not correct
        if (isLastAttempt && returnData.correctness !== 1)
        {
            returnData.correctAnswer = {};
            returnData.correctAnswer.keyValues = answerKey.answers.correctValues[0];

            deferred.resolve(returnData);
        }
        else
        {
            deferred.resolve(returnData);
        }
        
        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Retrieve the correct answer.
     * For multivalue, we take the first element of the answerKey.answers.correctValues
     * array and shove that into a keyValues property in returnData.correctAnswer.
     *
     * @param {Promise} returnData    returnData with correctAnswer attached
     * @param {Object}  answerKey     contains the answers
     */
    this.retrieveCorrectAnswer = function(returnData, answerKey)
    {
        var deferred = Q.defer();
        var answers = answerKey.answers;

        returnData.correctAnswer = {};
        returnData.correctAnswer.keyValues = answerKey.answers.correctValues[0];

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


