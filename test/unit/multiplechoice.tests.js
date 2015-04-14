/* **************************************************************************
 * $Workfile:: multiplechoice.tests.js                                      $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains unit tests for multiplechioce.js
 *
 *
 * Created on       Oct 11, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
//force test environment
process.env.NODE_ENV = 'test';

var sinon = require('sinon');
var nock = require('nock');
var expect = require('chai').expect;
var config = require('config');

var utils = require('../../lib/utils');
var CE = require('../../lib/ce');
var MultipleChoice = require('../../lib/types/multiplechoice');

var mockdata = require('../test_messages/multiplechoice_incorrect_last.json');

// @todo - We're just testing multiple choice through the Engine's assess methods to date.  At
// some point we may want to test the individual methods exposed from MultipleChoice
// but as we're considering abstracting those at some point to a common module or a
// base class let's hold off on that for now.

/**
 * MultipleChoice Assessment tests.  We have to test these through the 
 * engine's assess method.
 */

describe('MultipleChoice assessments', function() {

    var multiplechoiceAssessmentHandler;

    var testReturnData;
    var testStudentSubmission;

    beforeEach(function () {
        multiplechoiceAssessmentHandler = MultipleChoice.createAssessmentHandler();

        testReturnData = {
        };
        
        testStudentSubmission = {
        };
    });

    describe.skip('answerSchema', function() {
    });
    describe.skip('submissionSchema', function() {
    });
    describe.skip('validateObj', function() {
    });
    describe.skip('preprocess', function() {
    });
    describe.skip('calculateScoreAndFeedback', function() {
    });
    describe('calculateStats', function() {

        var expectedResult;
        beforeEach(function () {
            expectedResult = {
                stats: {
                    typeCode: "Multi_Value_Question_User_Answered",
                    extensions: {
                        "Assessment_Item_Question_Type": "MultiValue",
                        "Assessment_Item_Response_Code": "MOCK-Response_Code",
                        "Student_Response": [
                            {
                                "Target_Id": "target",
                                "Answer_Id": "MOCK-Answer_Id",
                                "Target_Sub_Question_Response_Code": "MOCK-Response_Code"
                            }
                        ]
                    }
                }
            };
        });

        describe('given correctness evaluated to correct', function() {
            it('should should return analytic data with Response_Code="Correct"', function (done) {
                testReturnData.correctness = 1;
                testStudentSubmission.key = 'FAKE-answer-key';
                multiplechoiceAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                .then(function(result){
                    expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Correct';
                    expectedResult.stats.extensions.Student_Response[0].Answer_Id = testStudentSubmission.key;
                    expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Correct';
                    expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                    done();
                })
                .catch(function(error){
                    done(error);
                });
            });
        });

        describe('given correctness evaluated to incorrect', function() {
            it('should should return analytic data with Response_Code="Incorrect"', function (done) {
                testReturnData.correctness = 0;
                testStudentSubmission.key = 'FAKE-answer-key2';
                multiplechoiceAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                .then(function(result){
                    expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Incorrect';
                    expectedResult.stats.extensions.Student_Response[0].Answer_Id = testStudentSubmission.key;
                    expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Incorrect';
                    expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                    done();
                })
                .catch(function(error){
                    done(error);
                });
            });
        });
        
    });

    describe.skip('addCorrectAnswer', function() {
    });
    describe.skip('retrieveCorrectAnswer', function() {
    });
    

    describe('MultipleChoice assessments: FUNCTIONAL TEST', function() {
        var ce = null;
        var handler = null;

        before(function () {
            ce = new CE.EngineHandler();
        });

        it('should complain if answer is badly formatted', function (done) {
            var data = utils.cloneObject(mockdata);
            data.answerKey = {assessmentType: "multiplechoice", assessmentWrong: "thingy", answers: "string"};
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(err).to.not.be.null;
                    //expect(err.message).to.equal('Validation failed');
                    expect(result).to.be.null;
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should complain if submission is badly formatted', function (done) {
            var data = utils.cloneObject(mockdata);
            data.studentSubmission = {"submissiony": {"thing": "so wrong"}};
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(err).to.not.be.null;
                    //console.log(err);
                    //expect(err.message).to.equal('Validation failed');
                    expect(result).to.be.null;
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should complain if submission is not in answer key', function (done) {
            var data = utils.cloneObject(mockdata);
            data.studentSubmission = {"key": "pants"};
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(err).to.not.be.null;
                    expect(err.message).to.equal('Submission Key not in answer key');
                    expect(result).to.be.null;
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should handle incorrect submission', function (done) {
            var data = utils.cloneObject(mockdata);
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(0);
                    expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.equal('option003');
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultipleChoice');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should handle correct submission', function (done) {
            var data = utils.cloneObject(mockdata);
            data.studentSubmission.key = "option000";
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(1);
                    expect(result.feedback).to.equal('Your answer <%= studAnsValue %> is correct. Growth rate stays constant.');
                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.equal('option000');
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultipleChoice');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should report back the correct answer if isLastAttempt is true', function (done) {
            var data = utils.cloneObject(mockdata);
            // set an incorrect answer, just for fun.
            data.studentSubmission.key = "option003";
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(0);
                    expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                    expect(result.correctAnswer.key).to.equal('option000');
                    expect(result.correctAnswer.feedback).to.equal('Your answer <%= studAnsValue %> is correct. Growth rate stays constant.');
                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.equal('option003');
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultipleChoice');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should report back the correct answer with empty feedback string if isLastAttempt is true', function (done) {
            var data = utils.cloneObject(mockdata);
            // set an incorrect answer, just for fun.
            data.studentSubmission.key = "option003";
            // remove the feedback value from the correct answer
            data.answerKey.answers.option000.response = "";

            ce.processSubmission(data, function(err, result)  {
                try {
                    //console.log(JSON.stringify(result));
                    expect(result.correctness).to.equal(0);
                    expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                    expect(result.correctAnswer.key).to.equal('option000');
                    expect(result.correctAnswer.feedback).to.equal('');
                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.equal('option003');
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultipleChoice');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should not report back the correct answer if isLastAttempt is false', function (done) {
            var data = utils.cloneObject(mockdata);

            data.studentSubmission.key = "option003";
            data.isLastAttempt = false;
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(0);
                    expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                    expect(result.correctAnswer).to.be.null;
                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.equal('option003');
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultipleChoice');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

    });

    /**
     * MultipleChoice Assessment Retreive answer tests.  We have to test these through the 
     * engine's retrieveAnswer method.
     */
    describe('MultipleChoice retrieve answer', function() {
        var ce = null;
        var handler = null;

        before(function () {
            ce = new CE.EngineHandler();
        });    

        it('should retrieve the correct answer', function(done) {
            var data = utils.cloneObject(mockdata);
            var answerKey = data.answerKey;

            ce.retrieveAnswer(answerKey, function(err, result) {
                try {
                    expect(result.correctAnswer).to.deep.equal({ key: 'option000' });
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });
    });
});
