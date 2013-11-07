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
     * returnData object to be passed back regardless of input
     * @type {Object}
     */
    this.returnData = {
        "correctness": 1,
        "feedback": "You are correct.",
        "correctAnswer": null
    };

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
        deferred.resolve(this.returnData);
        return deferred.promise;
    };

    /**
     * Stub method
     * @return {Promise} returnData
     */
    this.preprocess = function()
    {
        var deferred = Q.defer();
        deferred.resolve(this.returnData);
        return deferred.promise;
    };

    /**
     * Stub method
     * @return {Promise} returnData
     */
    this.calculateScoreAndFeedback = function()
    {
        var deferred = Q.defer();
        deferred.resolve(this.returnData);
        return deferred.promise;
    };

    /**
     * Stub method
     * @return {Promise} returnData
     */
    this.addCorrectAnswer = function()
    {
        var deferred = Q.defer();
        deferred.resolve(this.returnData);
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