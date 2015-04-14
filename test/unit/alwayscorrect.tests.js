/* **************************************************************************
 * $Workfile:: alwayscorrect.tests.js                                       $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains unit tests for alwayscorrect.js
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
var AlwaysCorrect = require('../../lib/types/alwayscorrect');

var alwaysCorrectMockData = require('../test_messages/alwaysCorrect.json');

// @todo - We're just testing through the Engine's assess methods to date.  At
// some point we may want to test the individual methods exposed
// but as we're considering abstracting those at some point to a common module or a
// base class let's hold off on that for now.

/**
 * AlwaysCorrect Assessment tests.  We have to test these through the 
 * engine's assess method.
 */
describe('AlwaysCorrect assessments', function() {

    var alwayscorrectAssessmentHandler;

    var testReturnData;
    var testStudentSubmission;

    beforeEach(function () {
        alwayscorrectAssessmentHandler = AlwaysCorrect.createAssessmentHandler();

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
                        "Assessment_Item_Response_Code": "Correct",
                        "Student_Response": [
                            {
                                "Target_Id": "Target",
                                "Answer_Id": null,
                                "Target_Sub_Question_Response_Code": "Correct"
                            }
                        ]
                    }
                }
            };
        });

        it('should should return analytic data with Response_Code="Correct"', function (done) {
            testReturnData.correctness = 1;
            testStudentSubmission.key = 'FAKE-answer-key';
            alwayscorrectAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
            .then(function(result){
                expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Correct';
                expectedResult.stats.extensions.Student_Response[0].Answer_Id = null;
                expectedResult.stats.extensions.Student_Response[0].Target_Sub_Question_Response_Code = 'Correct';
                expect(result.stats.extensions).to.deep.equal(expectedResult.stats.extensions);
                done();
            })
            .catch(function(error){
                done(error);
            });
        });
        
    });

    describe.skip('addCorrectAnswer', function() {
    });
    describe.skip('retrieveCorrectAnswer', function() {
    });

    describe('FUNCTIONAL TEST', function() {
         var ce = null;
         var handler = null;

         before(function () {
            ce = new CE.EngineHandler();
         });

        it('should handle correct alwayscorrect submission', function (done) {
            var data = utils.cloneObject(alwaysCorrectMockData);
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(1);
                    expect(result.stats.response).to.equal('I love always correct types.');
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('AlwaysCorrect');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should handle correct alwayscorrect submission of some fictional type', function (done) {
            var data = utils.cloneObject(alwaysCorrectMockData);
            delete data.studentSubmission.entry;
            data.studentSubmission.pants = "Oh, yeah!";
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(1);
                    expect(result.stats.response).to.equal('Oh, yeah!');
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('AlwaysCorrect');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should handle correct alwayscorrect submission of some other fictional type', function (done) {
            var data = utils.cloneObject(alwaysCorrectMockData);
            delete data.studentSubmission;
            data.studentSubmission = "Oh, no.";
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(1);
                    expect(result.stats.response).to.equal('Oh, no.');
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('AlwaysCorrect');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should handle correct alwayscorrect submission of yet another fictional type', function (done) {
            var data = utils.cloneObject(alwaysCorrectMockData);
            delete data.studentSubmission;
            // This should return the first key as the result.stats.response
            data.studentSubmission = {
                "pantsOpinion": "Oh, no.",
                "pantsNum": 2445
            };
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(1);
                    expect(result.stats.response).to.equal('Oh, no.');
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('AlwaysCorrect');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should handle correct alwayscorrect submission of yet another another fictional type', function (done) {
            var data = utils.cloneObject(alwaysCorrectMockData);
            delete data.studentSubmission;
            // This should return the first key as the result.stats.response
            data.studentSubmission = {
                "pantsOpinions": [
                    { "jeans": true },
                    { "leggings": true },
                    { "mensCapris": false }
                ]
            };
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(1);
                    expect(result.stats.response).to.equal('student submission is not a string value');
                    expect(result.stats.answerId).to.be.null;                
                    expect(result.stats.assessmentItemQuestionType).to.equal('AlwaysCorrect');
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
     * AlwaysCorrect Assessment Retreive answer tests.  We have to test these through the 
     * engine's retrieveAnswer method.
     */
    describe('AlwaysCorrect retrieve answer', function() {
        var ce = null;
        var handler = null;

        before(function () {
            ce = new CE.EngineHandler();
        });

        it('should retrieve the correct answer', function(done) {
            var data = utils.cloneObject(alwaysCorrectMockData);
            var answerKey = data.answerKey;

            ce.retrieveAnswer(answerKey, function(err, result) {
                try {
                    expect(result.correctAnswer).to.be.null;
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