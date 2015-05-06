/* **************************************************************************
 * $Workfile:: alwayscorrect.js                                            $
 * *********************************************************************/ /**
 *
 * @fileoverview An assessmentType that always returns correct.
 *
 * This was originally used by Journal, but now Journal uses 'discussions'
 * assessmentType.
 * Although this type can be used for any other purpose, it may be tricky
 * to generalize the analytics message structure.
 *
 * Created on       Oct 15, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
var config = require('config');
var Q = require('q');
var _ = require('underscore');
var utils = require('../utils');



/* **************************************************************************
 * alwayscorrect class                                                 */ /**
 *
 * @constructor
 *
 * @classdesc
 * Very simple.  Always returns correct.
 *
 ****************************************************************************/
function AssessmentHandler()
{
    var logger = utils.getLogger(config, 'alwayscorrect');

    /**
     * Stub methods returning nothing
     */
    this.answerSchema = function() { return; };
    this.submissionSchema = function() { return; };

    /**
     * Stub method
     * @return {Object} returnData
     */
    this.validateObj = function()
    {
        var deferred = Q.defer();
        deferred.resolve();
        return deferred.promise;
    };

    /**
     * Stub method
     * @return {Object} returnData
     */
    this.preprocess = function()
    {
        var deferred = Q.defer();

        var returnData = {
            "correctness": 1,
            "feedback": "You are correct.",
            "correctAnswer": null
        };

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Stub method
     * @return {Object} returnData
     */
    this.calculateScoreAndFeedback = function(returnData, answerKey, studentSubmission)
    {
        var deferred = Q.defer();
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
    * For alwaysCorrect, studentSubmission is added to "response" and "answerId" 
    * is null.
    * 
    * @param  {Object} returnData        returnData object
    * @param  {Object} studentSubmission contains the student submission
    * @return {Object}                   the returnData object with score and feedback attached
    */
    this.calculateStats = function(returnData, studentSubmission)
    {
        var deferred = Q.defer();
        returnData.stats = {};

        /** TinCan 1.0 properties {{ */
        returnData.stats.assessmentItemQuestionType = "AlwaysCorrect";

        // As the 'key' may vary for alwaysCorrect submissions (for example, Journals use
        // "entry": "blahblah") we take the value of whatever key is presented, or just
        // the studentSubmission if we can't find keys
        var keys = _.isObject(studentSubmission) ? _.keys(studentSubmission) : null;
        if (keys && keys[0])
        {
            returnData.stats.response = _.isString(studentSubmission[keys[0]]) ? studentSubmission[keys[0]] : "student submission is not a string value";    
        } else
        {
            returnData.stats.response = studentSubmission;
        }

        returnData.stats.answerId = null;
        /** }} TinCan 1.0 */

        /** TinCan 2.0, context.extensions part:
         * @see https://devops-tools.pearson.com/stash/projects/DAALT_REF/repos/schemas/browse/src/main/resources/seer/TinCan/Multi_Value_Question_User_Answered.Schema.json?at=v2.0.1
         *
         * It does not include properties 
         * Assessment_Source_System_Record_Id, Assessment_Source_System_Code
         * Assessment_Item_Source_System_Record_Id, Assessment_Item_Source_System_Code
         * which are set in IPS's 
         * DataAnalyticsHelper.buildMessage at DefaultFlowStrategy.buildSubmissionAnalyticsData_:
         */
        returnData.stats.typeCode = "Multi_Value_Question_User_Answered";
        var responseCode = "Correct"; // Always correct
        returnData.stats.extensions = {
            // @todo - if we are to use the "AlwaysCorrect" type as a generic
            //      type, we will have to figure out how we are going to set
            //      the Assessment_Item_Question_Type property.
            "Assessment_Item_Question_Type": "MultiValue",

            "Assessment_Item_Response_Code": responseCode,

            "Student_Response": [
                {
                    "Target_Id": "Target", // @todo - what shall put here??
                    "Answer_Id": null,
                    "Target_Sub_Question_Response_Code": responseCode
                }
            ]
        };


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
     * For Always Correct that's a null value.
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