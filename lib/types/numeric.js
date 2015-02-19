/* **************************************************************************
 * $Workfile:: numeric.js                                                   $
 * *********************************************************************/ /**
 *
 * @fileoverview The numeric assessmentType is managed herein.
 *
 * Created on       February 11, 2015
 * @author          Michael Jay Lippert
 *
 * @copyright (c) 2015 Pearson, All rights reserved.
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
 * numeric class                                                       */ /**
 *
 * @constructor
 *
 * @classdesc
 * Assesses numeric answers.
 *
 ****************************************************************************/
function AssessmentHandler()
{
    // @todo - I think there's a logger implementation bug somewhere...I don't think
    // each individual file should be creating their own logger, which seems to be
    // happening.
    var logger = utils.getLogger(config, 'numeric');

    /**
     * schema for answers.
     * @return {Object} schema for answers
     */
    this.answerSchema = function ()
    {
        var schema =
            {
                "$schema": "http://pearson.com/brix/numeric/answerkey/0.1/schema#",
                "title": "Brix Numeric AnswerKey",
                "description": "The answer key used to determine the correctness of a student's numeric value submission",
                "type": "object",
                "required": ["assessmentType", "answers"],
                "properties":
                {
                    "assessmentType":
                    {
                        "description": "identifies this answer key as being for a numeric type question",
                        "type": "string",
                        "enum": ["numeric"]
                    },
                    "answers":
                    {
                        "description": "the correct key values and feedback for when the submitted answer is correct and incorrect.",
                        "type": "object",
                        "required": ["correctValue", "correctResponse", "incorrectResponses"],
                        "properties":
                        {
                            "correctValue":
                            {
                                "description": "The correct numeric value",
                                "type": "number"
                            },
                            "acceptableError":
                            {
                                "description": "The acceptable tolerance for a submitted value to be considered correct.",
                                "oneOf":
                                [
                                    {
                                        "description": "If a single number then a correct answer is the correctValue +/- the acceptableError.",
                                        "type": "number"
                                    },
                                    {
                                        "description": "If an array, it must contain 2 elements and a correct answer is between (inclusive) the correctValue - acceptableError[0] and correctValue + acceptableError[1].",
                                        "type": "array",
                                        "items": { "type": "number" },
                                        "minItems": 2,
                                        "maxItems": 2
                                    }
                                ]
                            },
                            "notifyOnCorrectNotExact":
                            {
                                "description": "Flag if it is desirable to note in the correct response when the answer was not within acceptableError but not exact.",
                                "type": "boolean"

                            },
                            "correctResponse":
                            {
                                "description": "The feedback for the student who answered correctly",
                                "type": "string"
                            },
                            "incorrectResponses":
                            {
                                "description": "The feedback for the student who answered incorrectly within the associated range.",
                                "type": "array",
                                "items":
                                {
                                    "type": "object",
                                    "required": ["wrongRange", "feedback"],
                                    "properties":
                                    {
                                        "wrongRange":
                                        {
                                            "description": "The numeric range [0] - [1] the answer must fall between to return the associated incorrect feedback.",
                                            "type": "array",
                                            "items": { "type": "number" },
                                            "minItems": 2,
                                            "maxItems": 2
                                        },
                                        "feedback": { "type": "string" }
                                    }
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

        return schema;
    };

    /**
     * schema for submission.
     * @return {Object} schema for submission
     */
    this.submissionSchema = function ()
    {
        var schema =
            {
                "$schema": "http://pearson.com/brix/numeric/studentsubmission/0.1/schema#",
                "title": "Brix Numeric Value Student Submission",
                "description": "Student Submission",
                "type": "object",
                "required": [ "value" ],
                "additionalProperties": false,
                "properties":
                {
                    "value":
                    {
                        "description": "the number submitted to be evaluated",
                        "type": "number"
                    }
                }
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
                        logger.error('numeric scheme validation error.', err);
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
     * For numeric score and feedback calculation go hand in hand. For
     * other assessment types we may want to break those out from here.
     *
     * @param {!Object} returnData
     *      returnData object stub
     *
     * @param {!Object} answerKey
     *      contains the answers
     *
     * @param {!pearson.brix.utils.IAnswerMan.SubmittedAnswer_numeric} studentSubmission
     *      contains the student submission
     *
     * @returns {Promise} the returnData object with score and feedback attached
     */
    this.calculateScoreAndFeedback = function(returnData, answerKey, studentSubmission)
    {
        var deferred = Q.defer();
        var questionSolution = answerKey.answers;

        // Assume answer is incorrect
        returnData['correctness'] = 0;
        returnData['feedback'] = '';

        var correctValue = questionSolution['correctValue'];

        // acceptableError is either undefined, an array of one element, or an
        // array of two elements defining the low and high errors around the
        // correct value.
        // The default acceptableError is 0.
        var correctValueLow = correctValue;
        var correctValueHigh = correctValue;
        var acceptableError = questionSolution['acceptableError'];
        if (_.isNumber(acceptableError))
        {
            correctValueLow -= acceptableError;
            correctValueHigh += acceptableError;
        }
        else if (_.isArray(acceptableError) && acceptableError.length == 2)
        {
            correctValueLow -= acceptableError[0];
            correctValueHigh += acceptableError[1];
        }

        // Default is to notify
        var toleranceNotify = !_.isUndefined(questionSolution['notifyOnCorrectNotExact'])
                                ? questionSolution['notifyOnCorrectNotExact']
                                : true;

        var studentAnswer = studentSubmission['value'];

        if ( studentAnswer >= correctValueLow && studentAnswer <= correctValueHigh)
        {
            returnData['correctness'] = 1;
            returnData['feedback'] = questionSolution['correctResponse'];

            if (toleranceNotify && studentAnswer !== correctValue)
            {
                var toleranceText = 'Your answer is close enough to be correct, but check for tolerance or other errors. ';
                returnData['feedback'] = toleranceText + returnData['feedback'];
            }
        }
        else
        {
            // if the answer is neither right nor within error tolerance, then figure out which of the
            // wrong feedback conditions apply and return that custom feedback, if any.
            questionSolution['incorrectResponses'].some(
                    function (wrongFeedback)
                    {
                        var range = wrongFeedback['wrongRange'];
                        if (studentAnswer >= range[0] && studentAnswer <= range[1])
                        {
                            returnData['feedback'] = wrongFeedback['feedback'];
                            return true;
                        }

                        return false;
                    }, this);
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

        returnData.stats.assessmentItemQuestionType = "Numeric";

        // @todo - this will all have to change when we do the update mcq's and this tincan stuff.
        returnData.stats.answerId = null;
        returnData.stats.response = null;

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Calculate the correct answer if appropriate. For Numeric that's
     * the numeric value in answerKey.answers.correctValue.
     *
     * @param {Promise} returnData    returnData with correctAnswer attached
     * @param {Object}  answerKey     contains the answers
     * @param {boolean} isLastAttempt whether this is the student's last attempt or not
     */
    this.addCorrectAnswer = function(returnData, answerKey, isLastAttempt)
    {
        var deferred = Q.defer();
        var questionSolution = answerKey.answers;

        // By default send null here (not an empty object)
        returnData.correctAnswer = null;
        // Send correct answer when it's the last attempt and they're not correct
        if (isLastAttempt && returnData.correctness !== 1)
        {
            returnData.correctAnswer =
                {
                    answer: { value: questionSolution.correctValue },
                    feedback: questionSolution.correctResponse
                };
        }

        deferred.resolve(returnData);
        return deferred.promise;
    };

    /**
     * Retrieve the correct answer.
     * For numeric, we take the answerKey.answers.correctValue and shove that
     * into an answer property in returnData.correctAnswer.
     *
     * @param {Promise} returnData    returnData with correctAnswer attached
     * @param {Object}  answerKey     contains the answers
     */
    this.retrieveCorrectAnswer = function(returnData, answerKey)
    {
        var deferred = Q.defer();
        var questionSolution = answerKey.answers;

        returnData.correctAnswer = {};
        returnData.correctAnswer.answer = { value: questionSolution.correctValue };

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
