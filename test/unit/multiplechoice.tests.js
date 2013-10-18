/* **************************************************************************
 * $Workfile:: ce.tests.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains unit tests for ce.js
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
var MultipleChoice = require('../../lib/types/multiplechoice');

var mockdata = {
    "sequenceNodeKey": "8238fsdfhe9h9shdds",
    "answerKey": {
        "assessmentType": "multiplechoice",
        "answers": {
            "option000": {
              "response": "Your answer <%= studAnsValue %> is correct. Growth rate stays constant.",
              "score": 1
            },
            "option001": {
              "response": "Does the growth rate change with population size?",
              "score": 0
            },
            "option002": {
              "response": "Does the fertility rate change with population size?",
              "score": 0
            },
            "option003": {
            "response": "This might happen but is it something is necessarily occurs?",
            "score": 0
            }
        }
    },
    "studentSubmission": { "submission": "option000"},
    "isLastAttempt": true
};

describe('CE handles assessments', function() {
    var mc = null;

    before(function () {
        mc = new MultipleChoice.AssessmentHandler();
    });

    // @todo - unskip this when we implement a schema
    it('should complain if answer is badly formatted', function (done) {
        var data = utils.cloneObject(mockdata);
        data.answerKey = {assessmentWrong: "thingy", answers: "string"};
        mc.assess(data, function(err, result)  {
            try {
                expect(err).to.not.be.null;
                expect(err.message).to.equal('Validation failed');
                expect(result).to.be.null;
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    // @todo - unskip this when we implement a schema
    it('should complain if submission is badly formatted', function (done) {
        var data = utils.cloneObject(mockdata);
        data.studentSubmission = {"submissiony": {"thing": "so wrong"}};
        mc.assess(data, function(err, result)  {
            try {
                expect(err).to.not.be.null;
                expect(err.message).to.equal('Validation failed');
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
        data.studentSubmission = {"submission": "pants"};
        mc.assess(data, function(err, result)  {
            try {
                expect(err).to.not.be.null;
                expect(err.message).to.equal('Submission not in answer key');
                expect(result).to.be.null;
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
        mc.assess(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(1);
                expect(result.feedback).to.equal('Your answer <%= studAnsValue %> is correct. Growth rate stays constant.');
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
        data.studentSubmission.submission = "option003";
        mc.assess(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
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
        data.studentSubmission.submission = "option003";
        mc.assess(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                expect(result.correctAnswer).to.equal('option000');
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

        data.studentSubmission.submission = "option003";
        data.isLastAttempt = false;
        mc.assess(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
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
