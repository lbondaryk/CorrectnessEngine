/* **************************************************************************
 * $Workfile:: ce-integration.tests.js                                      $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains communication tests for ce.js
 *
 * This test simulates the remote call to the Brix CE Server. It tests the
 * REST service: the complete hhtp call from Hapi route settings for the endpoints: 
 * - assessments/
 *
 *
 * Created on       Oct 21, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
//force test environment
process.env.NODE_ENV = 'test';

var request = require('supertest');  // HTTP testing  
var Hapi = require('hapi');
var expect = require('chai').expect;
var config = require('config');
var Controller = require('../../lib/controller');
var utils = require('../../lib/utils');

var multiplechoice_incorrect_last = require('../test_messages/multiplechoice_incorrect_last.json');
var multiplechoice_incorrect_notlast = require('../test_messages/multiplechoice_incorrect_notlast.json');


describe('IPC -> CE Multiple Choice', function()
{
    var server = null;
    var hubnock = null;
    var seqNodeKey  = null;
    var url = null;

    before(function (done) {
        server = appStartUp();
        done();
    });

    it('should return a valid Result given a valid but incorrect submission message on not last attempt', function (done) {
        var properReturnVal = {
            "correctness": 0,
            "feedback": "Does the fertility rate change with population size?",
            "correctAnswer": null,
            "stats": {"answerId":"option002", "response":null}
        };
        var message = utils.cloneObject(multiplechoice_incorrect_notlast);
        request(server.listener)
            .post('/assessments')
            .send(message)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/) // Verify the content type
            .expect(200) // Verify the result code (200=OK)
            .end(function(err, result)
            {
                if (err) return done(err);
                try {
                    //console.log("@@@:"+JSON.stringify(result.body));
                    expect(result.body.code).to.equal(200);
                    expect(result.body.status).to.equal('success');
                    expect(result.body.data).to.deep.equal(properReturnVal);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        );
    });

    it('should return a valid Result given a valid but incorrect submission message on last attempt', function (done) {
		var properReturnVal = {
            "correctness": 0,
            "feedback": "This might happen but is it something is necessarily occurs?",
            "correctAnswer": {
                "key": "option000",
                "feedback": "Your answer <%= studAnsValue %> is correct. Growth rate stays constant."
            },
            "stats": {"answerId":"option003", "response":null}
        };
		var message = utils.cloneObject(multiplechoice_incorrect_last);
		request(server.listener)
            .post('/assessments')
            .send(message)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/) // Verify the content type
            .expect(200) // Verify the result code (200=OK)
            .end(function(err, result)
            {
				if (err) return done(err);
                try {
                    console.log("@@@:"+JSON.stringify(result.body));
                    expect(result.body.code).to.equal(200);
                    expect(result.body.status).to.equal('success');
                    expect(result.body.data).to.deep.equal(properReturnVal);
                    done();
                } catch (e) {
                    done(e);
                }
			}
		);
    });

    it('should return a valid Result given a valid but incorrect submission message without correct answer', function (done) {
		var properReturnVal = {
            "correctness": 0,
            "feedback": "This might happen but is it something is necessarily occurs?",
            "correctAnswer": null,
            "stats": {"answerId":"option003", "response":null}
        };
		var message = utils.cloneObject(multiplechoice_incorrect_last);
		message.isLastAttempt = false;
		request(server.listener)
            .post('/assessments')
            .send(message)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/) // Verify the content type
            .expect(200) // Verify the result code (200=OK)
            .end(function(err, result)
            {
				if (err) return done(err);
                try {
                    //console.log("@@@:"+JSON.stringify(result.body));
                    expect(result.body.code).to.equal(200);
                    expect(result.body.status).to.equal('success');
                    expect(result.body.data).to.deep.equal(properReturnVal);
                    done();
                } catch (e) {
                    done(e);
                }
			}
		);
    });

    it('should return a valid Result given a valid correct submission message', function (done) {
		var properReturnVal = {
            "correctness": 1,
            "feedback": "Your answer <%= studAnsValue %> is correct. Growth rate stays constant.",
            "correctAnswer": null,
            "stats": {"answerId":"option000", "response":null}
        };
		var message = utils.cloneObject(multiplechoice_incorrect_last);
		message.studentSubmission.key = "option000";
		request(server.listener)
            .post('/assessments')
            .send(message)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/) // Verify the content type
            .expect(200) // Verify the result code (200=OK)
            .end(function(err, result)
            {
				if (err) return done(err);
                try {
                    //console.log("@@@:"+JSON.stringify(result.body));
                    expect(result.body.code).to.equal(200);
                    expect(result.body.status).to.equal('success');
                    expect(result.body.data).to.deep.equal(properReturnVal);
                    done();
                } catch (e) {
                    done(e);
                }
			}
		);
    });

    it('should return an error given terrible data', function (done) {
		var properReturnVal = "the value of answerKey is not allowed to be undefined, the value of studentSubmission is not allowed to be undefined, the value of isLastAttempt is not allowed to be undefined, the key &#x28;pants&#x29; is not allowed";
		var message = {"pants":"32"};
		request(server.listener)
            .post('/assessments')
            .send(message)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/) // Verify the content type
            .expect(400) // Verify the result code (200=OK)
            .end(function(err, result)
            {
				if (err) return done(err);
                try {
                    //console.log("@@@:"+JSON.stringify(result.body));
                    expect(result.body.code).to.equal(400);
                    // @todo - for whatever reason we aren't getting 'status' back in the return body.  we should look into this.
                    //expect(result.body.status).to.equal('success');
                    expect(result.body.message).to.equal(properReturnVal);
                    done();
                } catch (e) {
                    done(e);
                }
			}
		);
    });

});


/**
 * Fake app server loading our controller
 * @return {Object} server object
 */
var appStartUp = function() {

    serverOptions = {
        debug: {
            request: ['error', 'uncaught']
        },
        router: {
            isCaseSensitive: false
        }
    };

    server = new Hapi.Server(config.host, config.port, serverOptions);

    var controller = new Controller();
    server.route(controller.routes);
    
    return server;
};