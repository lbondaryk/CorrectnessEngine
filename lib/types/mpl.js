/* **************************************************************************
 * $Workfile:: mpl.js                                                       $
 * *********************************************************************/ /**
 *
 * @fileoverview The MyProgrammingLab mpl assessmentType is managed herein.
 * Largely this farms the student's submission out to the mpl/turingscraft
 * api.
 *
 * Created on       Sept 4, 2014
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
var request = require('request');
var crypto = require('crypto');
var utils = require('../utils');


/* **************************************************************************
 * mpl class                                                           */ /**
 *
 * @constructor
 *
 * @classdesc
 * Assesses mpl questions. 
 *
 ****************************************************************************/
function AssessmentHandler()
{
    // @todo - I think there's a logger implementation bug somewhere...I don't think
    // each individual file should be creating their own logger, which seems to be
    // happening.
    var logger = utils.getLogger(config, 'mpl');

    /**
     * schema for answers.
     * @return {Object} schema for answers
     */
    this.answerSchema = function()
    {
        return {
            "$schema": "http://pearson.com/brix/mpl/answerkey/0.1/schema#",
            "title": "Brix MPL AnswerKey",
            "description": "The answer key used to determine the correctness of a student's multiple choice selection, and the feedback for their answer",
            "type": "object",
            "required": ["assessmentType", "answers"],
            "properties":
            {
                "assessmentType":
                    {
                        "description": "identifies this answer key as being for an mpl type question",
                        "type": "string",
                        "enum": ["mpl"]
                    },
                "answers":
                    {
                        "description": "the exssn (Exercise SSN)",
                        "type": "object",
                        "additionalProperties":
                            {
                                "type": "string",
                                "required": ["exssn"],
                                "properties":
                                    {
                                        "exssn":
                                            {
                                                "description": "The identifier for the MPL Exercise, in [integer]-[integer] format",
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
     * schema for submission.  MPL submissions is just a string.
     * @return {Object} schema for submission
     */
    this.submissionSchema = function()
    {
        return {
            "$schema": "http://pearson.com/brix/mpl/studentsubmission/0.2/schema#",
            "title": "Brix MPL Student Submission",
            "description": "Student Submission",
            "type": "string"
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
                logger.error('mpl scheme validation error.', err);
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
     * There's nothing to do with MPL so this is just a pass-thru.
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
     * For MPL, we check the submission against the TuringsCraft API
     * 
     * @param  {Object} returnData        returnData object stub
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @return {Promise}                  the returnData object with score and feedback attached
     */
    this.calculateScoreAndFeedback = function(returnData, answerKey, studentSubmission)
    {
        var deferred = Q.defer();
        var exssn = answerKey.answers.exssn;


        var op = "hello";
        var timestamp = (new Date).getTime();

        // @todo - put these in config
        var tcBaseUrl = "https://dev.turingscraft.com:39484/codelab/jsp/api/api.jsp";
        var apiKey = "API_TESTER";
        var apiSecret = "1234567890";

        // build apiSig
        //hash( hash(api_secret) + hash( hash(api_secret) + message ) )
        
        // @todo - encode each of these:
        var message = apiSecret + '-' + 'api_key=' + apiKey + 'op=' + op + 'timestamp=' + timestamp;
        var hashedApiSecret = hash_(apiSecret);
        var apiSig = hash_( hashedApiSecret + hash_( hashedApiSecret + message));

        var fullUrl = tcBaseUrl + '?op=' + op + '&api_key=' + apiKey + '&timestamp=' + timestamp + '&api_sig=' + apiSig; 
        //'&exssn=' exssn + '&submission=' + submission;
        
        var url = "https://dev.turingscraft.com:39484/codelab/jsp/api/examples/widgetJSP+AJAX/tc_api_proxy.jsp?op=checkSubmission&exssn=00000-10001&submission=print(%22bobby%22)%3B";
        var headers = {
            'Content-Type': 'application/json'
        };

        var options = {
            url: fullUrl,
            headers: headers,
            encoding: "UTF-8"
        };
        // Send submission to TuringsCraft server
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the google web page.

                //returnData.correctness = data.correct; // this is a boolean, not a 0/1
                //returnData.feedback = data.feedback;

                deferred.resolve(returnData);
            } else {
                console.log(error);
                deferred.reject(error);
            }
        });

        // Match the student submission against the answerkey to determine
        // feedback and score
        //returnData.correctness = answers[submission].score;
        // @todo - 'response' may end up changing to 'feedback', in which case we'll have to change mock data
        //returnData.feedback = answers[submission].response;

        
        return deferred.promise;
    };

    /**
    * Calculate stats
    *
    * Add data destined for the TinCan statement sent to DAALT for stats.  It wants
    * either an "answerId" (a key) or a "response" (a string) of what the student 
    * submitted.
    *
    * For MPL, answerId is null and we put the student submission in "response".
    * 
    * @param  {Object} returnData        returnData object stub
    * @param  {Object} studentSubmission contains the student submission
    * @return {Promise}                  the returnData object with score and feedback attached
    */
    this.calculateStats = function(returnData, studentSubmission)
    {
        var deferred = Q.defer();
        returnData.stats = {};

        returnData.stats.answerId = null;
        returnData.stats.response = studentSubmission;

        deferred.resolve(returnData);
        return deferred.promise;
    };   

    /**
     * Calculate the correct answer if appropriate.  For Multiple Choice that's
     * the answer with score: 1
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
        if (isLastAttempt && returnData.correctness !== 1) {

            // Can we even get the correct answer?

            deferred.resolve(returnData);

        } else {
            deferred.resolve(returnData);
        }
        return deferred.promise;
    };

    /**
     * [hash_ description]
     * @param  {[type]} message [description]
     * @return {[type]}         [description]
     */
    function hash_(message)
    {
        var c = crypto.createHash('sha256');
        c.update(message);
        var buf = c.digest();
        return buf.toString('hex');
    }
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


