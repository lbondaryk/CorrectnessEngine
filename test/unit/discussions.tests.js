/* **************************************************************************
 * $Workfile:: discussions.tests.js                                         $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains unit tests for discussions.js
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
var Discussions = require('../../lib/types/discussions');

var journalmockdata = require('../test_messages/journal.json');

// @todo - We're just testing through the Engine's assess methods to date.  At
// some point we may want to test the individual methods exposed
// but as we're considering abstracting those at some point to a common module or a
// base class let's hold off on that for now.

/**
 * Discussions Assessment tests.  We have to test these through the
 * engine's assess method.
 */
describe('Discussions assessments', function() {
var discussionsAssessmentHandler;

    var testReturnData;
    var testStudentSubmission;

    beforeEach(function () {
        discussionsAssessmentHandler = Discussions.createAssessmentHandler();

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
                        "Assessment_Item_Question_Type": "SimpleWriting",
                        "Assessment_Item_Response_Code": "Correct",
                        "Item_Response_Text": "FAKE-response",
                        //"Item_Response_Pass_Fail": "Pass"
                    }
                }
            };
        });

        it('should should return analytic data with Response_Code="Correct"', function (done) {
            testReturnData.correctness = 1;
            testStudentSubmission.entry = 'FAKE-entry';
            testStudentSubmission.postUrl = 'MOCK-url';

            expectedResult.stats.extensions.Item_Response_Stored_At_URL = testStudentSubmission.postUrl;

            discussionsAssessmentHandler.calculateStats(testReturnData, testStudentSubmission)
            .then(function(result){
                expectedResult.stats.extensions.Assessment_Item_Response_Code = 'Correct';
                expectedResult.stats.extensions.Item_Response_Text = testStudentSubmission.entry;
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

        it('should complain if answer is badly formatted', function (done) {
            var data = utils.cloneObject(journalmockdata);
            data.payload.answerKey = {assessmentType: "discussions", assessmentWrong: "thingy", answers: "string"};
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

        it('should handle correct discussions journal submission', function (done) {
            var data = utils.cloneObject(journalmockdata);
            ce.processSubmission(data, function(err, result)  {
                try {
                    expect(result.correctness).to.equal(1);
                    expect(result.discussions).to.be.true;
                    expect(result.brixState.authorId).to.equal(data.payload.answerKey.answers.authorId);
                    expect(result.brixState.topicId).to.equal(data.payload.answerKey.answers.topicId);
                    // @todo - this is the 2.1 code line.  remove the 'response' line.
                    //expect(result.stats.itemResponseText).to.equal('I love journals.');
                    expect(result.stats.response).to.equal('I love journals.');
                    expect(result.stats.answerId).to.be.null;
                    expect(result.stats.assessmentItemQuestionType).to.equal('SimpleWriting');
                    done();
                }
                catch (e)
                {
                    done(e);
                }
            });
        });

        it('should complain of a badly formatted submission', function (done) {
            var data = utils.cloneObject(journalmockdata);
            data.payload.studentSubmission = { "pants": "I love me some pants." };
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

    });

    /**
     * Discussions Assessment Retrieve answer tests.  We have to test these through the
     * engine's retrieveAnswer method.
     */
    describe('Discussions retrieve answer', function() {
        var ce = null;
        var handler = null;

        before(function () {
            ce = new CE.EngineHandler();
        });

        it('should retrieve the correct answer', function(done) {
            var data = utils.cloneObject(journalmockdata);
            data.payload = data.payload.answerKey;

            ce.retrieveAnswer(data, function(err, result) {
                try
                {
                    expect(err).to.be.null;
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
