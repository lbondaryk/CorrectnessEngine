/* **************************************************************************
 * $Workfile:: multivalue.tests.js                                          $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains unit tests for multivalue.js
 *
 *
 * Created on       Oct 1, 2014
 * @author          Seann Ives
 *
 * @copyright (c) 2014 Pearson, All rights reserved.
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
var Multivalue = require('../../lib/types/multivalue');

var mockdata = require('../test_messages/multivalue.json');

// @todo - We're just testing multivalue through the Engine's assess methods to date.  At
// some point we may want to test the individual methods exposed from multivalue
// but as we're considering abstracting those at some point to a common module or a
// base class let's hold off on that for now.

/**
 * Multivalue Assessment tests.  We have to test these through the 
 * engine's assess method.
 */
describe('Multivalue assessments', function() {

    var multivalueAssessmentHandler;

    var testReturnData;
    var testStudentSubmission;

    beforeEach(function () {
        multivalueAssessmentHandler = Multivalue.createAssessmentHandler();

        // Student answers 1 and 3 are the correct answers
        testReturnData = utils.cloneObject(mockdata);
        delete testReturnData.studentSubmission;
        
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

        var sampleExpectedResult = {
            stats: {
                typeCode: "Multi_Value_Question_User_Answered",
                extensions: {
                    "Assessment_Item_Question_Type": "MultiValue",
                    "Assessment_Item_Response_Code": "MOCK-Response_Code",
                    "Student_Response": [
                        {
                            "Target_Id": "true",
                            "Answer_Id": "MOCK-Answer_Id",
                            "Target_Sub_Question_Response_Code": "MOCK-Response_Code"
                        }
                    ]
                }
            }
        };

        describe('MultiSelect (values are of type boolean)', function() {
            var expectedResult;
            beforeEach(function () {
                expectedResult = utils.cloneObject(sampleExpectedResult);
            });

            describe('given no answer', function() {
                it('should should return analytic data with Response_Code="Incorrect"', function (done) {
                    testReturnData.correctness = 0; // Overall incorrect
                    testReturnData.brixState = {
                        "keyValueFeedback": {
                        }
                    };
                    // Student did not select any 
                    testStudentSubmission = {
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Incorrect';
                        expectedResult.stats.extensions.Student_Response = [];
                        
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });

            describe('given only one answer and it\'s correct', function() {
                it('should should return analytic data with Response_Code="Correct"', function (done) {
                    testReturnData.correctness = 1; // Overall correct
                    testReturnData.brixState = {
                        "keyValueFeedback": {
                            "answer1": true
                        }
                    };
                    // Student selected answers 1 
                    testStudentSubmission = {
                        "answer1": true
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Correct';
                        expectedResult.stats.extensions.Student_Response[0].Answer_Id = 'answer1';
                        expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Correct';
                        
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });

            describe('given all values to be correct (no brixState)', function() {
                it('should should return analytic data with Response_Code="Correct"', function (done) {
                    testReturnData.correctness = 1;
                    
                    // Student selected answers 1 and 3, both correct
                    testStudentSubmission = {
                        "answer1": true,
                        "answer3": true
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Correct';
                        expectedResult.stats.extensions.Student_Response[0].Answer_Id = 'answer1';
                        expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Correct';
                        expectedResult.stats.extensions.Student_Response.push({
                            Target_Id: 'true',
                            Answer_Id: 'answer3',
                            Target_Sub_Question_Response_Code: 'Correct'
                        });
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });

            describe('given all values to be correct', function() {
                it('should should return analytic data with Response_Code="Correct"', function (done) {
                    testReturnData.correctness = 1;
                    testReturnData.brixState = {
                        "keyValueFeedback": {
                            "answer1": true,
                            "answer3": true
                        }
                    };
                    // Student selected answers 1 and 3
                    testStudentSubmission = {
                        "answer1": true,
                        "answer3": true
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Correct';
                        expectedResult.stats.extensions.Student_Response[0].Answer_Id = 'answer1';
                        expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Correct';
                        expectedResult.stats.extensions.Student_Response.push({
                            Target_Id: 'true',
                            Answer_Id: 'answer3',
                            Target_Sub_Question_Response_Code: 'Correct'
                        });
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });


            describe('given one correct and one incorrect values', function() {
                it('should should return analytic data with Response_Code="Incorrect"', function (done) {
                    testReturnData.correctness = 0; // Overall incorrect
                    testReturnData.brixState = {
                        "keyValueFeedback": {
                            "answer1": true,
                            "answer2": false
                        }
                    };
                    // Student selected answers 1 and 2
                    testStudentSubmission = {
                        "answer1": true,
                        "answer2": true
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Incorrect';
                        expectedResult.stats.extensions.Student_Response[0].Answer_Id = 'answer1';
                        expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Correct';
                        expectedResult.stats.extensions.Student_Response.push({
                            Target_Id: 'true',
                            Answer_Id: 'answer2',
                            Target_Sub_Question_Response_Code: 'Incorrect'
                        });
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });
            
            describe('given all incorrect values', function() {
                it('should should return analytic data with Response_Code="Incorrect"', function (done) {
                    testReturnData.correctness = 0;
                    testReturnData.brixState = {
                        "keyValueFeedback": {
                            "answer2": false,
                            "answer4": false
                        }
                    };
                    // Student selected answers 2 and 4
                    testStudentSubmission = {
                        "answer2": true,
                        "answer4": true
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Incorrect';
                        expectedResult.stats.extensions.Student_Response[0].Answer_Id = 'answer2';
                        expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Incorrect';
                        expectedResult.stats.extensions.Student_Response.push({
                            Target_Id: 'true',
                            Answer_Id: 'answer4',
                            Target_Sub_Question_Response_Code: 'Incorrect'
                        });
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });

            describe('given all selections are correct, but missed some other corrects', function() {
                it('should should return analytic data with Response_Code="Incorrect"', function (done) {
                    testReturnData.correctness = 0;
                    testReturnData.brixState = {
                        "keyValueFeedback": {
                            "answer1": true,
                            "answer3": true
                        }
                    };
                    // Student selected answers 1 and 3, but missed some other correct answer
                    testStudentSubmission = {
                        "answer1": true,
                        "answer3": true
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Incorrect';
                        expectedResult.stats.extensions.Student_Response[0].Answer_Id = 'answer1';
                        expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Correct';
                        expectedResult.stats.extensions.Student_Response.push({
                            Target_Id: 'true',
                            Answer_Id: 'answer3',
                            Target_Sub_Question_Response_Code: 'Correct'
                        });
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });

        });

        describe('D&D and Binning (values are of type string)', function() {
            var expectedResult;
            beforeEach(function () {
                expectedResult = utils.cloneObject(sampleExpectedResult);
                
            });

            describe('given only one answer and it\'s incorrect', function() {
                it('should should return analytic data with Response_Code="Incorrect"', function (done) {
                    testReturnData.correctness = 0;

                    testReturnData.brixState = {
                        "keyValueFeedback": {
                            "answer1":false
                        }
                    };
                    // Student did not select any (although it may not be possible by UI)
                    testStudentSubmission = {
                        "answer1": "the_wronganswer"
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Incorrect';
                        expectedResult.stats.extensions.Student_Response[0] = {
                            Target_Id: 'the_wronganswer',
                            Answer_Id: 'answer1',
                            Target_Sub_Question_Response_Code: 'Incorrect'
                        };
                        
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });

            describe('given all values to be correct', function() {
                it('should should return analytic data with Response_Code="Correct"', function (done) {
                    testReturnData.correctness = 1;
                    
                    testStudentSubmission = {
                        "answer1": "the_answer1",
                        "answer2": "the_answer2"
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Correct';
                        expectedResult.stats.extensions.Student_Response[0] = {
                            Target_Id: 'the_answer1',
                            Answer_Id: 'answer1',
                            Target_Sub_Question_Response_Code: 'Correct'
                        };
                        expectedResult.stats.extensions.Student_Response.push({
                            Target_Id: 'the_answer2',
                            Answer_Id: 'answer2',
                            Target_Sub_Question_Response_Code: 'Correct'
                        });
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });

            describe('given one correct and one incorrect values', function() {
                it('should should return analytic data with Response_Code="Incorrect"', function (done) {
                    testReturnData.correctness = 0;
                    testReturnData.brixState = {
                        "keyValueFeedback": {
                            "answer1": false,
                            "answer2": true
                        }
                    };
                    testStudentSubmission = {
                        "answer1": "wrong_answer",
                        "answer2": "the_answer2"
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Incorrect';
                        expectedResult.stats.extensions.Student_Response[0] = {
                            Target_Id: 'wrong_answer',
                            Answer_Id: 'answer1',
                            Target_Sub_Question_Response_Code: 'Incorrect'
                        };
                        expectedResult.stats.extensions.Student_Response.push({
                            Target_Id: 'the_answer2',
                            Answer_Id: 'answer2',
                            Target_Sub_Question_Response_Code: 'Correct'
                        });
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });
            
            describe('given all incorrect value', function() {
                it('should should return analytic data with Response_Code="Incorrect"', function (done) {
                    testReturnData.correctness = 0;
                    testReturnData.brixState = {
                        "keyValueFeedback": {
                            "answer1": false,
                            "answer2": false
                        }
                    };
                    // Student selected answers 1 and 2
                    testStudentSubmission = {
                        "answer1": 'wrong_answer',
                        "answer2": 'wrong_answer'
                    };
                    multivalueAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
                    .then(function(result){
                        expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Incorrect';
                        expectedResult.stats.extensions.Student_Response[0] = {
                            Target_Id: 'wrong_answer',
                            Answer_Id: 'answer1',
                            Target_Sub_Question_Response_Code: 'Incorrect'
                        };
                        expectedResult.stats.extensions.Student_Response.push({
                            Target_Id: 'wrong_answer',
                            Answer_Id: 'answer2',
                            Target_Sub_Question_Response_Code: 'Incorrect'
                        });
                        expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                        done();
                    })
                    .catch(function(error){
                        done(error);
                    });
                });
            });
        });
    });

    describe.skip('addCorrectAnswer', function() {
    });
    describe.skip('retrieveCorrectAnswer', function() {
    });

    describe('Multivalue assessments: FUNCTIONAL TEST', function() {
        var ce = null;
        var handler = null;

        before(function () {
            ce = new CE.EngineHandler();
        });

        it('should complain if answer is badly formatted', function (done) {
            var data = utils.cloneObject(mockdata);
            data.payload.answerKey = {assessmentType: "multivalue", assessmentWrong: "thingy", answers: "string"};
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
            // @todo - the student submission validation is really questionable for this.
            data.payload.studentSubmission = "stringy";
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

        it('should handle incorrect submission', function (done) {
            var data = utils.cloneObject(mockdata);
            data.payload.studentSubmission = {
                "answer1": true,
                "answer2": true
            };
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(0);
                    expect(result.feedback).to.equal('Nope, sorry try again');
                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultiValue');
                    expect(result.brixState.keyValueFeedback).to.deep.equal({ answer1: true, answer2: false });
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should handle another incorrect submission', function (done) {
            var data = utils.cloneObject(mockdata);
            data.payload.studentSubmission = {
                "answer1": true,
                "answer2": true,
                "answer3": true
            };
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(0);
                    expect(result.feedback).to.equal('Nope, sorry try again');
                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultiValue');
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
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(1);
                    expect(result.feedback).to.equal("We need enough more food to support the increase in population but it isn't going to quadruple by 2050.");
                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultiValue');
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
            data.payload.studentSubmission = {
                "answer1": true,
                "answer2": true,
                "answer3": true
            };
            data.payload.isLastAttempt = true;
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(0);
                    expect(result.feedback).to.equal('Nope, sorry try again');
                    expect(result.correctAnswer.keyValues).to.be.an('object');
                    expect(result.correctAnswer.keyValues).to.deep.equal({answer1: true, answer3: true});

                    expect(result.stats.response).to.be.null;
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('MultiValue');
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
     * Multivalue Assessment Retreive answer tests.  We have to test these through the 
     * engine's retrieveAnswer method.
     */
    describe('Multivalue retrieve answer', function() {
        var ce = null;
        var handler = null;

        before(function () {
            ce = new CE.EngineHandler();
        });

        it('should retrieve the correct answer', function(done) {
            var data = utils.cloneObject(mockdata);

            ce.retrieveAnswer(data, function(err, result) {
                try {
                    expect(result.correctAnswer.keyValues).to.deep.equal({ "answer1": true, "answer3": true });
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
