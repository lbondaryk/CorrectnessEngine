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
var MultipleChoice = require('../../lib/types/multiplechoice');

var journalmockdata = require('../test_messages/journal.json');

// @todo - We're just testing multiple choice through the Engine's assess methods to date.  At
// some point we may want to test the individual methods exposed from MultipleChoice
// but as we're considering abstracting those at some point to a common module or a
// base class let's hold off on that for now.

/**
 * AlwaysCorrect Assessment tests.  We have to test these through the 
 * engine's assess method.
 */
 describe('AlwaysCorrect assessments', function() {
     var ce = null;
     var handler = null;

     before(function () {
        ce = new CE.EngineHandler();
     });

    it('should handle correct alwayscorrect journal submission', function (done) {
        var data = utils.cloneObject(journalmockdata);
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(1);
                expect(result.stats.response).to.equal('I love journals.');
                expect(result.stats.answerId).to.be.null;
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it('should handle correct alwayscorrect submission of some fictional type', function (done) {
        var data = utils.cloneObject(journalmockdata);
        delete data.studentSubmission.entry;
        data.studentSubmission.pants = "Oh, yeah!";
        console.log(data);
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(1);
                expect(result.stats.response).to.equal('Oh, yeah!');
                expect(result.stats.answerId).to.be.null;
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });

    it('should handle correct alwayscorrect submission of some other fictional type', function (done) {
        var data = utils.cloneObject(journalmockdata);
        delete data.studentSubmission;
        data.studentSubmission = "Oh, no.";
        console.log(data);
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(1);
                expect(result.stats.response).to.equal('Oh, no.');
                expect(result.stats.answerId).to.be.null;
                done();
            }
            catch (e)
            {
                done(e);
            }
        });
    });
});
