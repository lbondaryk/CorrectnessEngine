/* **************************************************************************
 * $Workfile:: programmingexercise.tests.js                                 $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains unit tests for multiplechioce.js
 *
 *
 * Created on       Sept 15, 2014
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
var ProgrammingExercise = require('../../lib/types/programmingexercise');

var mockdata = {
    "sequenceNodeKey": "8238fsdfhe9h9shdds",
    "answerKey": {
        "assessmentType": "programmingexercise",
        "answers": {
            "exerciseId": "00000-10001"
        }
    },
    "studentSubmission": {
        "entry": "test;"
    },
    "isLastAttempt": false
};

var sub1 = "total += 0.0;";
var sub2 = "total = 0.0; for (k = 0; k < n; k++) total += temps[k]; avgTemp = total / double(n);"

var mockdata2 = {
    "sequenceNodeKey": "8238fsdfhe9h9shdds",
    "answerKey": {
        "assessmentType": "programmingexercise",
        "answers": {
            "exerciseId": "00000-10629"
        }
    },
    "studentSubmission": {
        "entry": sub1
    },
    "isLastAttempt": false
};

// @todo - Currently these are all actually testing against the TC api, 
// which it really shouldn't.  You should be mocking things.  A bunch
// of the tests are skipped as a result.

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

    it('should complain if answer is badly formatted', function (done) {
        var data = utils.cloneObject(mockdata);
        data.answerKey = {assessmentWrong: "thingy", answers: "string"};
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

//@todo - this works but we should do this with a mock.  You could put this as-is or close to that
//        in the integration tests.
    it.skip('should handle incorrect submission', function (done) {
        var data = utils.cloneObject(mockdata2);
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                //console.log(result);
                //expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                expect(result.feedback).to.not.be.null;
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

    it.skip('should handle correct submission', function (done) {
        var data = utils.cloneObject(mockdata);
        data.studentSubmission.key = "option000";
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(1);
                expect(result.feedback).to.equal('Your answer <%= studAnsValue %> is correct. Growth rate stays constant.');
                expect(result.stats.response).to.be.null;
                expect(result.stats.answerId).to.equal('option000');
                expect(result.stats.assessmentItemQuestionType).to.equal('ProgrammingExercise');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it.skip('should report back the correct answer if isLastAttempt is true', function (done) {
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
                expect(result.stats.assessmentItemQuestionType).to.equal('ProgrammingExercise');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it.skip('should report back the correct answer with empty feedback string if isLastAttempt is true', function (done) {
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
                expect(result.stats.assessmentItemQuestionType).to.equal('ProgrammingExercise');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it.skip('should not report back the correct answer if isLastAttempt is false', function (done) {
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

/**
 * ProgrammingExercise Assessment Retreive answer tests.  We have to test these through the 
 * engine's retrieveAnswer method.
 */
describe('ProgrammingExercise retrieve answer', function() {
    var ce = null;
    var handler = null;

    before(function () {
        ce = new CE.EngineHandler();
    });    

    it.skip('should retrieve the correct answer', function(done) {
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
