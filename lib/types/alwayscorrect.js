/* **************************************************************************
 * $Workfile:: alwayscorrect.js                                            $
 * *********************************************************************/ /**
 *
 * @fileoverview An assessmentType that always returns correct.
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
     * @return {Promise} returnData
     */
    this.validateObj = function()
    {
        var deferred = Q.defer();
        deferred.resolve();
        return deferred.promise;
    };

    /**
     * Stub method
     * @return {Promise} returnData
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
     * @return {Promise} returnData
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
    * @return {Promise}                  the returnData object with score and feedback attached
    */
    this.calculateStats = function(returnData, studentSubmission)
    {
        var deferred = Q.defer();
        returnData.stats = {};

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
        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Stub method, just passing along returnData
     * 
     * @param  {Object} returnData        returnData object
     * @return {Promise} returnData
     */
    this.addCorrectAnswer = function(returnData, answerKey, isLastAttempt)
    {
        var deferred = Q.defer();
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