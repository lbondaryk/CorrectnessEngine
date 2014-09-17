/* **************************************************************************
 * $Workfile:: mpl.tests.js                                                 $
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
var MPL = require('../../lib/types/mpl');

var mockdata = {
    "sequenceNodeKey": "8238fsdfhe9h9shdds",
    "answerKey": {
        "assessmentType": "mpl",
        "answers": {
            "exssn": "00000-10001"
        }
    },
    "studentSubmission": {
        "entry": "test"
    },
    "isLastAttempt": false
};

// @todo - We're just testing through the Engine's assess methods to date.  At
// some point we may want to test the individual methods exposed from MPL
// but as we're considering abstracting those at some point to a common module or a
// base class let's hold off on that for now.

/**
 * MPL Assessment tests.  We have to test these through the 
 * engine's assess method.
 */
describe('MPL assessments', function() {
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

    it.only('should handle incorrect submission', function (done) {
        var data = utils.cloneObject(mockdata);
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                //expect(result.feedback).to.equal('This might happen but is it something is necessarily occurs?');
                expect(result.feedback).to.not.be.null;
                expect(result.stats.response).to.not.be.null;
                expect(result.stats.answerId).to.be.null
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
 * MPL Assessment Retreive answer tests.  We have to test these through the 
 * engine's retrieveAnswer method.
 */
describe('MPL retrieve answer', function() {
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
