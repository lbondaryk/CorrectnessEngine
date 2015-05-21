/* **************************************************************************
 * $Workfile:: programmingexercise.js                                       $
 * *********************************************************************/ /**
 *
 * @fileoverview The programmingexercise MyProgrammingLab assessmentType is
 * managed herein.
 * Largely this farms the student's submission out to the MPL/turingscraft
 * api.
 *
 * Created on       Sept 4, 2014
 * @author          Seann Ives
 *
 * @copyright (c) 2014 Pearson, All rights reserved.
 *
 * **************************************************************************/
var config = require('config');
var Q = require('q');
var ZSchema = require('z-schema');
var _ = require('underscore');
var request = require('request');
var crypto = require('crypto');
var utils = require('../utils');

var urlencode = require('urlencode');

// NOTE: If you uncomment this, all request responses will be spewed to console.
// This is handy for debugging but unnecessary for production.
//require('request-debug')(request);


/* **************************************************************************
 * programmingexercise class                                           */ /**
 *
 * @constructor
 *
 * @param {!Object} options
 *      configuration properties
 *
 * @classdesc
 * Assesses a programmingexercise question for a user/course.
 *
 ****************************************************************************/
function AssessmentHandler(options)
{
    // @todo - I think there's a logger implementation bug somewhere...I don't think
    // each individual file should be creating their own logger, which seems to be
    // happening.
    var logger = utils.getLogger(config, 'programmingexercise');

    // instance properties
    
    /**
     * Context about the question being assessed, who is submitting answers and
     * what course is the question a part of.
     *
     * @private
     * @type {{ userId: string, courseId: string }}
     */
    this.context_ = options.context;

    /**
     * schema for answers.
     * @return {Object} schema for answers
     */
    this.answerSchema = function ()
    {
        var schema =
            {
                "$schema": "http://pearson.com/brix/programmingexercise/answerkey/0.1/schema#",
                "title": "Brix ProgrammingExercise AnswerKey",
                "description": "The answer key used to determine the identifier for the corresponding TuringsCraft exercise",
                "type": "object",
                "required": ["assessmentType", "answers"],
                "properties":
                {
                    "assessmentType":
                    {
                        "description": "identifies this answer key as being for an programmingexercise type question",
                        "type": "string",
                        "enum": ["programmingexercise"]
                    },
                    "answers":
                    {
                        "description": "the exerciseId (Exercise SSN) and the codeExamples - todo",
                        "type": "object"
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

        return schema;
    };

    /**
     * schema for submission.  ProgrammingExercise submissions is just a string.
     * @return {Object} schema for submission
     */
    this.submissionSchema = function ()
    {
        var schema =
            {
                "$schema": "http://pearson.com/brix/programmingexercise/studentsubmission/0.2/schema#",
                "title": "Brix ProgrammingExercise Student Submission",
                "description": "Student Submission",
                "type": "object",
                "properties":
                {
                    "entry":
                    {
                        "description": "submission code",
                        "type": "string"
                    }
                },
                "required": [ "entry" ]
            };

        return schema;
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
    this.validateObj = function (obj, schema)
    {
        var deferred = Q.defer();
        ZSchema.validate(obj, schema,
            function (err, report)
            {
                if (err)
                {
                    logger.error('programmingexercise scheme validation error.', err);
                    deferred.reject(err);
                }
                else
                {
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
     * There's nothing to do with ProgrammingExercise so this is just a pass-thru.
     *
     * @param  {Object} returnData        returnData object stub
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @return {Promise}                  the returnData object stub
     */
    this.preprocess = function (returnData, answerKey, studentSubmission)
    {
        var deferred = Q.defer();

        deferred.resolve(returnData);

        return deferred.promise;
    };

     /**
     * Calculate score and feedback
     *
     * Check the submission against the TuringsCraft API
     *
     * @param  {Object} returnData        returnData object stub
     * @param  {Object} answerKey         contains the answers
     * @param  {Object} studentSubmission contains the student submission
     * @return {Promise}                  the returnData object with score and feedback attached
     */
    this.calculateScoreAndFeedback = function (returnData, answerKey, studentSubmission)
    {
        var deferred = Q.defer();
        var exerciseId = encodeURIComponent(answerKey.answers.exerciseId);

        // dummy ids that match the typical values
        var userId = this.context_.userId;
        var courseId = this.context_.courseId;

        // We need to encode the student submission (string) as it's going into an html param.
        // @todo - This actually might be something we'd want to do within the client bric.
        encStudentSubmission = encodeURIComponent(studentSubmission.entry);

        var op = "checkSubmission";
        var timestamp = (new Date).getTime();

        // TuringsCraft endpoint and authentication
        var tcUrl = config.turingsCraft.baseUrl + "/codelab/jsp/api/api.jsp";
        var apiKey = config.turingsCraft.apiKey;
        var apiSecret = config.turingsCraft.apiSecret;

        // build apiSig to this scheme:
        //   hash( hash(api_secret) + hash( hash(api_secret) + message ) )

        var message = apiSecret + '-' +
                      'api_key=' + apiKey +
                      'course_id' + courseId +
                      'exssn=' + exerciseId +
                      'op=' + op +
                      'submission=' + studentSubmission.entry +
                      'timestamp=' + timestamp +
                      'user_id' + userId;

        var hashedApiSecret = hash_(apiSecret);
        var apiSig = hash_( hashedApiSecret + hash_( hashedApiSecret + message));

        var fullUrl = tcUrl + '?op=' + op +
                              '&api_key=' + apiKey +
                              '&timestamp=' + timestamp +
                              '&api_sig=' + apiSig +
                              '&exssn=' + exerciseId +
                              '&user_id=' + userId +
                              '&course_id=' + courseId +
                              '&submission=' + encStudentSubmission;

        var headers =
            {
                'content-type': 'application/json;charset=UTF-8'
            };

        var options =
            {
                url: fullUrl,
                headers: headers,
                encoding: "UTF-8"
            };

        // Send submission to TuringsCraft server
        request(options,
            function (error, response, body)
            {
                if (!error && response.statusCode == 200)
                {
                    parsedBody = JSON.parse(body);

                    logger.debug('Return data from TuringsCraft', parsedBody);

                    returnData.correctness = parsedBody.correct ? 1 : 0; // this is a boolean, not a 0/1
                    returnData.feedback = null; // We don't care about TC's stock feedback string

                    returnData.brixState = {};
                    returnData.brixState.codeEvaluation = {};

                    // Temporary kludge to expose all of the TCI response to the client code. -mjl 5/19/2015
                    returnData.brixState.codeEvaluation.rawJSONdata = parsedBody;

                    // array of strings from TC
                    returnData.brixState.codeEvaluation.codeFeedback = parsedBody.feedback;

                    // If we're correct, the above encompasses all we send back to the client.
                    // If we're incorrect, we add some stuff.
                    if (!parsedBody.correct)
                    {
                        var codeEvaluation = returnData.brixState.codeEvaluation;
                        codeEvaluation.errorType = parsedBody.errorType;
                        codeEvaluation.compErr = parsedBody.compErr; // @todo parse this string on the <br>'s
                        codeEvaluation.submission = parsedBody.submission;
                        codeEvaluation.highlighting = parsedBody.highlighting;
                        codeEvaluation.apiVersion = parsedBody.api_version;
                        codeEvaluation.highlightingErrorCount = parsedBody.highlightingErrorCount;
                        codeEvaluation.testCase = parsedBody.testCase;
                    }

                    deferred.resolve(returnData);
                }
                else
                {
                    // @todo - do this up.
                    //console.log("got an error");
                    //console.log(error); // this is null in this case
                    //console.log(body) // the error message returns in the body, not an error
                    deferred.reject(error);
                }
            });

        return deferred.promise;
    };

    /**
    * Calculate stats
    *
    * Add data destined for the TinCan statement sent to DAALT for stats.  It wants
    * either an "answerId" (a key) or a "response" (a string) of what the student
    * submitted.
    *
    * For ProgrammingExercise, answerId is null and we put the student submission in "response".
    *
    * @param  {Object} returnData        returnData object stub
    * @param  {Object} studentSubmission contains the student submission
    * @return {Promise}                  the returnData object with score and feedback attached
    */
    this.calculateStats = function (returnData, studentSubmission)
    {
        var deferred = Q.defer();
        returnData.stats = {};

        /** TinCan 1.0 properties {{ */
        returnData.stats.assessmentItemQuestionType = "ProgrammingExercise";

        returnData.stats.answerId = null;
        returnData.stats.response = studentSubmission;
        /** }} TinCan 1.0 */

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Calculate the correct answer if appropriate.  This will be the entire
     * codeExamples array.
     *
     * @param {Promise} returnData    returnData with correctAnswer attached
     * @param {Object}  answerKey     contains the answers
     * @param {boolean} isLastAttempt whether this is the student's last attempt or not
     */
    this.addCorrectAnswer = function (returnData, answerKey, isLastAttempt)
    {
        var deferred = Q.defer();

        // By default send null here (not an empty object)
        returnData.correctAnswer = null;
        // Send correct answer when it's the last attempt or they're correct.
        // NOTE: This is a little different than the other types, where we ONLY
        // send back the correct answer when they're out of chances and still
        // wrong.
        if (isLastAttempt || returnData.correctness === 1)
        {
            if (_.has(answerKey.answers, 'codeExamples'))
            {
                returnData.correctAnswer = {};
                returnData.correctAnswer.codeExamples = answerKey.answers.codeExamples;
            }
            deferred.resolve(returnData);

        }
        else
        {
            deferred.resolve(returnData);
        }

        return deferred.promise;
    };

    /**
     * Retrieve the correct answer.
     *
     * @param {Promise} returnData    returnData with correctAnswer attached
     * @param {Object}  answerKey     contains the answers
     */
    this.retrieveCorrectAnswer = function (returnData, answerKey)
    {
        var deferred = Q.defer();
        var answers = answerKey.answers;

        // By default send null here (not an empty object)
        returnData.correctAnswer = null;

        if (_.has(answerKey.answers, 'codeExamples'))
        {
            returnData.correctAnswer = {};
            returnData.correctAnswer.codeExamples = answerKey.answers.codeExamples;
        }
        deferred.resolve(returnData);

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Create a sha256 hash
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


