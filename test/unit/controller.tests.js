/* **************************************************************************
 * $Workfile:: controller.tests.js                                          $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains unit tests for routes controller.js
 *
 * NOTE: This was largely pilfered from the Pearson node app reference
 * implementation.  At this point it's mainly testing that routes
 * exist, not that they really do stuff.
 * 
 * Created on       Oct 11, 2013
 * @author          Young-Suk Ahn Park
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
//force test environment
process.env.NODE_ENV = 'test';

var assert = require('assert');
var nock = require('nock');
var sinon = require('sinon');
var _ = require('underscore');
var Joi = require('joi');
var expect = require('chai').expect;
var config = require('config');
var utils = require('../../lib/utils');
var Controller = require('../../lib/controller');

// @todo - go through and remove all the 'assert's and change them to 'expects'.

describe ('CE Controller', function(){

    describe ('constructor()', function(){

        it ('should return a Controller object', function(done) {

            //Arrange
            
            //Act
            var controller = new Controller();

            //Arrange
            expect(controller).to.exist;
            expect(controller).to.be.an.instanceof(Controller);
            done();
        });

    });

    describe ('routes property', function() {

        it ('should return an array of routes', function(done) {

            //Arrange
            var controller = new Controller();

            
            //Act
            var routes = controller.routes;

            //Assert
            assert(routes, 'routes should exist');
            assert(_.isArray(routes), 'routes should be an array');
            // Routes in here must be in the same order as routes in controller.js for the following to play nicely
            assert.strictEqual(routes.length, 3, 'there should be 2 routes in the array');
            assert.strictEqual(routes[0].method, 'GET', '/healthInfo should be a GET');
            assert.strictEqual(routes[1].method, 'POST', '/assessments should be a POST');
            assert.strictEqual(routes[2].method, 'POST', '/retrieveAnswer should be a POST');
            routes.forEach(function(route) {
                assert(_.isObject(route), 'the route should be an object');
                assert(_.isFunction(route.handler), 'the route handler should be set correctly');
            });
            
            done();

        });
    });

    // Note: this does an "integration" style test through the /healthInfo route, meaning these tests touch
    // more than just the code in controller.js.  We won't be using this style of test for our 
    // sequenceNode routes here.  Please see the tests in /test/integration for that kind of thing.
    describe ('/healthInfo handler', function() {
        
        it ('should work', function(done) {
            
            //Arrange
            var controller = new Controller();
            var handler = controller.routes[0].handler;
            var request = new RequestMock(onReplyCallback);
            
            //Act
            handler(request);
            
            //Assert
            function onReplyCallback(replyValue) {
                assert(replyValue, 'the handler should reply');
                assert.deepEqual(replyValue, getExpectedSuccessResponse());
                done();
            }
            
        });
        
    });

    describe ('joi schema validation', function () {
        //Arrange
        var controller = null;
        var ce = null;


        before(function () {
            controller = new Controller();
        });

        it ('should accept a proper initialization payload', function(done) {
            var payload = {
                "sequenceNodeKey": "123",
                "answerKey": {
                    "things": "good"
                },
                "studentSubmission": {
                    "stuff": "great"
                },
                "isLastAttempt": false
            };
            var err = Joi.validate(payload,controller.assessmentsJoiSchema());
            expect(err).to.be.null;
            done();
        });
    });

    describe ('/assessments handler', function() {
        var controller = null;
        var handler = null;

        before(function () {
            controller = new Controller();
            handler = controller.routes[1].handler;
        });

        // We sandbox our sinon stubs within each 'it'.  Otherwise the method wrapper we write in on lasts indefinitely.
        var sandbox;
        beforeEach(function () {
            sandbox = sinon.sandbox.create();
        });
        afterEach(function () {
            sandbox.restore();
        });



        it ('should return a success result under normal conditions', function(done) {
            var stub = sandbox.stub(controller.ce, "processSubmission", function (data, callback) {
                var result = {"correctness": 1};
                callback(null, result);
            });

            var request = new RequestMock(onReplyCallback);
            
            //Act
            //handler(request);
            // We need a this object w/ the headers in it until hapi is upgraded
            var handlerThis = { raw: { req: { headers: { 'pi-id': 'me', 'course-id': 'calc101'} } } };
            handler.call(handlerThis, request);
            
            //Assert
            function onReplyCallback(replyValue) {
                expect(replyValue).to.exist;
                expect(stub.called).to.be.true;
                expect(replyValue.status).to.equal('success');
                done();
            }

        });
        it ('should return an error', function(done) {
            var stub = sandbox.stub(controller.ce, "processSubmission", function (data, callback) {
                var error = {"message": "Whack, bro."};
                callback(error, null);
            });

            var request = new RequestMock(onReplyCallback);
            
            //Act
            //handler(request);
            // We need a this object w/ the headers in it until hapi is upgraded
            var handlerThis = { raw: { req: { headers: { 'pi-id': 'me', 'course-id': 'calc101'} } } };
            handler.call(handlerThis, request);

            //Assert
            function onReplyCallback(replyValue) {
                expect(replyValue).to.exist;
                expect(stub.called).to.be.true;
                expect(replyValue.status).to.equal('error');
                done();
            }
        });
    });
});


function getExpectedSuccessResponse() {
    return "Alive";
}

function getExpectedFailureResponse() {
    return {
        "isBoom":true,
        "response":{
            "code":404,
            "payload":{
                "code":404,
                "error":"Not Found"
                
            },
            "headers":{}
        }
    };
}


function RequestMock(onReplyCallback) {
    this.reply = function(value) {
        onReplyCallback(value);
    };
    this.payload = {"test": 1};
}

