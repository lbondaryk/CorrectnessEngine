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
var CE = require('../../lib/ce').CE;

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
    "studentSubmission": { "submission": "option003"},
    "isLastAttempt": true
};

describe('CE handles assessments', function() {
    var ce = null;

    before(function () {
        ce = new CE();
    });

    it('should throw an error with unknown type submissions', function (done) {
        var data = utils.cloneObject(mockdata);
        // update the assessmentType to some bad data
        data.answerKey.assessmentType = "monkey";
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(err).to.equal('The assessmentType \'monkey\' can not be processed by this Correctness Engine');
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it('should handle correct multiple choice submission', function (done) {
        var data = utils.cloneObject(mockdata);
        ce.processSubmission(data, function(err, result)  {
            try {
                //@todo
                expect(true).to.be.true;
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it('should handle incorrect multiple choice submission', function (done) {
        var data = utils.cloneObject(mockdata);
        ce.processSubmission(data, function(err, result)  {
            try {
                //@todo
                expect(result.correctness).to.equal(0);
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it('should handle correct alwayscorrect submission', function (done) {
        var data = utils.cloneObject(mockdata);
        data.answerKey.assessmentType = "alwayscorrect";
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(1);
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });




});
