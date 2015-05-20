/* **************************************************************************
 * $Workfile:: controller.js                                                $
 * *********************************************************************/ /**
 *
 * @fileoverview Herein contains routes and validation for the data coming
 *               in through those routes.
 *
 * Created on       Oct 9, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
var Hapi = require('hapi');
var config = require('config');
var utils = require('./utils');
var CE = require('./ce');

/* **************************************************************************
 * Controller module                                                   */ /**
 *
 * Constructor.
 *
 * @constructor
 *
 * @classdesc
 * Routes for /healthInfo, 
 *            /assessments
 *
 * Validation for the routes.
 *
 * Version history:
 * - 2.1.0        Support for the Revel 2.1.0 release
 * - 2.2.0-dev.0  Start development for version 2.2.0         
 * - 2.2.0-rc.1   Release Candidate 1 for 2.2.0
 *                BRIX-348 add numeric assessment type
 * - 2.2.0        released to Production
 * - 2.3.0-dev.0  Start development for version 2.3.0         
 * - 2.3.0-dev.1  assessment handlers modified to support TinCan 2.0
 *
 ****************************************************************************/
module.exports = function()
{
    this.VERSION = '2.3.0-dev.1+20150506';
    
    this.ce = new CE.EngineHandler();

    var logger = utils.getLogger(config, 'controller');
    logger.info('Loading Controller version ' + this.VERSION + '.');

    var that_ = this;

    /**
     * joi (provided via hapi) schema for initialization payload.
     * @return {object} joi schema for initialization payload
     */
    this.assessmentsJoiSchema = function()
    {
        return {
            sequenceNodeKey: Hapi.types.String(),
            answerKey: Hapi.types.Object().required(),
            studentSubmission: Hapi.types.Object().required(),
            isLastAttempt: Hapi.types.Boolean().required()
        };
    };

    /**
     * joi (provided via hapi) schema for answer retrieval payload.
     * @return {object} joi schema for retrieveAnswer payload
     */
    this.retrieveAnswerJoiSchema = function()
    {
        return {
            //sequenceNodeKey: Hapi.types.String(),
            //answerKey: Hapi.types.Object().required()
            assessmentType: Hapi.types.String().required(),
            // @todo - Verify if the 'answers' property is common to all answerTypes.
            answers: Hapi.types.Object()
        };
    };

    this.routes = [
    {
        method: 'GET',
        path: '/healthInfo',
        handler: function (request)
        {
            request.reply("Alive");
            // @todo - consider what you really want here.  IPS should be doing a healthcheck against this.
            //request.reply("Alive").type("application/json");
        }
    },
    {
        method: 'POST',
        path: '/assessments',
        handler: function (request)
        {
            // NOTE: once hapi is upgraded, the line below will not be needed
            request.headers = this.raw.req.headers;
            // @todo - the request object here contains crazy nested objects and logging this is almost useless
            // unless we somehow unpack these.  JSON.stringify just throws a 'Converting circular structure to JSON'
            // error.
            logger.debug('Handle assessments', request.payload);
            that_.ce.processSubmission(request, function(err, result)
            {
                var replyPayload = {
                    code: 200,
                    data: result,
                    status: "success"
                };
                if (err) {
                    replyPayload.code = 400;
                    replyPayload.message = err;
                    replyPayload.status = 'error';
                }
                request.reply(replyPayload);
            });
        },
        config: {
            description: "BIPS->CE Assessment",
            validate: {
                payload: this.assessmentsJoiSchema()
            }
        }
    },
    {
        method: 'POST',
        path: '/retrieveAnswer',
        handler: function (request)
        {
            // NOTE: once hapi is upgraded, the line below will not be needed
            request.headers = this.raw.req.headers;
            // @todo - the request object here contains crazy nested objects and logging this is almost useless
            // unless we somehow unpack these.  JSON.stringify just throws a 'Converting circular structure to JSON'
            // error.
            logger.debug('Handle retrieve answer', request);
            that_.ce.retrieveAnswer(request, function(err, result)
            {
                var replyPayload = {
                    code: 200,
                    data: result,
                    status: "success"
                };
                if (err) {
                    replyPayload.code = 400;
                    replyPayload.message = err;
                    replyPayload.status = 'error';
                }
                request.reply(replyPayload);
            });
        },
        config: {
            description: "BIPS->CE Retrieve Answer",
            validate: {
                payload: this.retrieveAnswerJoiSchema()
            }
        }
    },
    ];

};
