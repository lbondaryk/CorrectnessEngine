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
var MultipleChoice = require('../../lib/types/multiplechoice');

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
     var ce = null;
     var handler = null;

     before(function () {
        ce = new CE.EngineHandler();
     });

    it('should handle correct discussions journal submission', function (done) {
        var data = utils.cloneObject(journalmockdata);
        ce.processSubmission(data, function(err, result)  {
            try {
                expect(result.correctness).to.equal(1);
                expect(result.discussions).to.be.true;
                expect(result.stats.itemResponseText).to.equal('I love journals.');
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
        data.studentSubmission = { "pants": "I love me some pants." };
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
 * Discussions Assessment Retreive answer tests.  We have to test these through the 
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
