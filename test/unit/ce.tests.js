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

describe('CE handles assessments', function() {
    var ce = null;

    before(function () {
        ce = new CE();
    });

    it('should...', function (done) {
        expect(true).to.be.ok;
        done();
    });

});
