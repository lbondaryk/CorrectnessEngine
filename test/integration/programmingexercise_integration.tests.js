/* **************************************************************************
 * $Workfile:: programmingexercise_integration.tests.js                     $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains integration tests for programmingexercise.js
 * which hit the TC servers.
 *
 *
 * Created on       Dec 3, 2014
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
var _ = require('underscore');

var utils = require('../../lib/utils');
var CE = require('../../lib/ce');
var ProgrammingExercise = require('../../lib/types/programmingexercise');

var mockdata =
    {
        "headers":
        {
            "pi-id": "ffffffff54950ba0e4b0feb658a6dbc6",
            "course-id": "54950cd1e4b0f74ecb09c358"
        },
        "payload":
        {
            "sequenceNodeKey": "8238fsdfhe9h9shdds",
            "answerKey":
            {
                "assessmentType": "programmingexercise",
                "answers":
                {
                    "exerciseId": "00000-10001",
                    "codeExamples":
                    [
                        {
                            "code":
                            [
                                "for (total = 0.0, k = 0; k < n; k++)"
                            ]
                        }
                    ]
                }
            },
            "studentSubmission":
            {
                "entry": "test;"
            },
            "isLastAttempt": false
        }
    };

var sub1 = "total += 0.0;";
var sub2 = "total = 0.0; for (k = 0; k < n; k++) total += temps[k]; avgTemp = total / double(n);"

var mockdata2 =
    {
        "headers":
        {
            "pi-id": "ffffffff54950ba0e4b0feb658a6dbc6",
            "course-id": "54950cd1e4b0f74ecb09c358"
        },
        "payload":
        {
            "sequenceNodeKey": "8238fsdfhe9h9shdds",
            "answerKey":
            {
                "assessmentType": "programmingexercise",
                "answers":
                {
                    "exerciseId": "00000-10629",
                    "codeExamples":
                    [
                        {
                            "code":
                            [
                                "for (total = 0.0, k = 0; k < n; k++)",
                                "{",
                                "    total += temps[k];",
                                "}",
                                "",
                                "avgTemp = total / n;"
                            ]
                        }
                    ]
                }
            },
            "studentSubmission":
            {
                "entry": sub1
            },
            "isLastAttempt": false
        }
    };

/**
 * ProgrammingExercise Assessment tests.  We have to test these through the 
 * engine's assess method.
 */
describe('ProgrammingExercise assessments', function() {
    var ce = null;
    var handler = null;

    before(function () {
        ce = new CE.EngineHandler();
    });

    it('should handle incorrect submission', function (done) {
        var data = utils.cloneObject(mockdata2);
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                expect(result.feedback).to.be.null;
                expect(result.brixState.codeEvaluation).to.be.an('object');
                expect(result.stats.response).to.not.be.null;
                expect(result.stats.answerId).to.be.null;
                expect(result.stats.assessmentItemQuestionType).to.equal('ProgrammingExercise');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it('should handle correct submission', function (done) {
        var data = utils.cloneObject(mockdata2);
        data.payload.studentSubmission.entry = sub2;
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(1);
                expect(result.feedback).to.be.null;
                expect(result.brixState.codeEvaluation).to.be.an('object');

                // Verify a correct answer return with correct submission
                expect(result.correctAnswer).to.be.an('object');
                expect(result.correctAnswer.codeExamples).to.be.an('array');
                expect(result.correctAnswer.codeExamples[0].code).to.be.an('array');

                expect(result.stats.assessmentItemQuestionType).to.equal('ProgrammingExercise');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it('should report back the correct answer if isLastAttempt is true', function (done) {
        var data = utils.cloneObject(mockdata2);
        data.payload.isLastAttempt = true;

        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                expect(result.feedback).to.be.null;
                expect(result.brixState.codeEvaluation).to.be.an('object');
                expect(result.stats.response).to.not.be.null;
                expect(result.stats.answerId).to.be.null;

                // Verify a correct answer return with correct submission
                expect(result.correctAnswer).to.be.an('object');
                expect(result.correctAnswer.codeExamples).to.be.an('array');
                expect(result.correctAnswer.codeExamples[0].code).to.be.an('array');

                expect(result.stats.assessmentItemQuestionType).to.equal('ProgrammingExercise');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    // @todo - this is bs copied from mcq
    it.skip('should report back the correct answer with empty feedback string if isLastAttempt is true', function (done) {
        var data = utils.cloneObject(mockdata);
        // set an incorrect answer, just for fun.
        data.payload.studentSubmission.key = "option003";
        // remove the feedback value from the correct answer
        data.payload.answerKey.answers.option000.response = "";

        ce.processSubmission(data, function(err, result)  {
            try {
                //console.log(JSON.stringify(result));
                expect(result.correctness).to.equal(0);
                expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                expect(result.correctAnswer.key).to.equal('option000');
                expect(result.correctAnswer.feedback).to.equal('');
                expect(result.stats.response).to.be.null;
                expect(result.stats.answerId).to.equal('option003');
                expect(result.stats.assessmentItemQuestionType).to.equal('ProgrammingExercise');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    // @todo - this is bs copied from mcq
    it.skip('should not report back the correct answer if isLastAttempt is false', function (done) {
        var data = utils.cloneObject(mockdata);

        data.payload.studentSubmission.key = "option003";
        data.payload.isLastAttempt = false;
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                expect(result.correctAnswer).to.be.null;
                expect(result.stats.response).to.be.null;
                expect(result.stats.answerId).to.equal('option003');
                expect(result.stats.assessmentItemQuestionType).to.equal('ProgrammingExercise');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

});
