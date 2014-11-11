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
    var ce = null;
    var handler = null;

    before(function () {
        ce = new CE.EngineHandler();
    });

    it('should complain if answer is badly formatted', function (done) {
        var data = utils.cloneObject(mockdata);
        data.answerKey = {assessmentType: "multivalue", assessmentWrong: "thingy", answers: "string"};
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
        data.studentSubmission = "stringy";
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
        data.studentSubmission = {
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
                expect(result.keyValueFeedback).to.deep.equal({ answer1: false, answer2: true });
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
        data.studentSubmission = {
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
        data.studentSubmission = {
            "answer1": true,
            "answer2": true,
            "answer3": true
        };
        data.isLastAttempt = true;
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(0);
                expect(result.feedback).to.equal('Nope, sorry try again');
                //@todo - if you add correctAnswer back in, this will be an object, not null.
                expect(result.correctAnswer).to.be.null;
                //expect(result.correctAnswer.key).to.equal('option000');
                //expect(result.correctAnswer.feedback).to.equal('Your answer <%= studAnsValue %> is correct. Growth rate stays constant.');
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

    //@todo - add this back when you figure out correctAnswer
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
describe.skip('Multivalue retrieve answer', function() {
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
                expect(result.correctAnswer).to.deep.equal({ "answer1": true, "answer3": true });
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });    
});
