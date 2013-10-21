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
 *
 ****************************************************************************/
module.exports = function()
{

    this.ce = new CE.EngineHandler();

    var logger = utils.getLogger(config, 'controller');

    var that_ = this;

    /**
     * joi (provided via hapi) schema for initialization payload.
     * @return {object} joi schema for initialization payload
     */
    this.joiSchema = function()
    {
        return {
            sequenceNodeKey: Hapi.types.String(),
            answerKey: Hapi.types.Object().required(),
            studentSubmission: Hapi.types.Object().required(),
            isLastAttempt: Hapi.types.Boolean().required()
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
            logger.debug('Handle assessments', request);
            that_.ce.processSubmission(request.payload, function(err, result)
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
                payload: this.joiSchema()
            }
        }
    }
    ];

};