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
    var ce = null;
    var handler = null;

    before(function () {
        ce = new CE.EngineHandler();
    });

    // @todo - unskip this when we implement a schema
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

    // @todo - unskip this when we implement a schema
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
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

});
