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

var mcqmockdata = require('../test_messages/multiplechoice_incorrect_last.json');

describe('CE handles assessments', function() {
    var ce = null;

    before(function () {
        ce = new CE.EngineHandler();
    });

    it('should throw an error with unknown type submissions', function (done) {
        var data = utils.cloneObject(mcqmockdata);
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

});
