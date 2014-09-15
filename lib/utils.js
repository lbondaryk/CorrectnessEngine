/* **************************************************************************
 * $Workfile:: utils.js                                                     $
 * *********************************************************************/ /**
 *
 * @fileoverview contains common utility methods
 *
 * Created on       Sept 16, 2013
 * @author          Young-Suk Ahn Park
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

var bunyan = require('bunyan');
var Q = require('q'); // Promise pattern library
var request = require('request');

/***************************************************************************
 * Clones a JSON object.
 * 
 * @param {Object} obj      The JSON object to clone.
 ****************************************************************************/
module.exports.cloneObject = function(obj)
{
    return JSON.parse(JSON.stringify(obj));
};

/***************************************************************************
 * Gets the logger.
 * If the config argument contains the logger field, then a child logger is
 * created and returned. Otherwise a new bunyan logger is created.
 *  
 *
 * @param {Object} config        The configuration object that may contain the
 *                               logger field.
 * @param {String} componentName The name of the component.
 *
 * @return {Logger} The reference to the newly created logger
 *
 ****************************************************************************/
module.exports.getLogger = function(config, componentName) {
    var logger = null;
    if (config.logger)
    {
        // The config.logger is reference to the main logger instance
        // Created by the application
        logger = config.logger.child({component: componentName});
    }
    else
    {
        // This condition means that the function was called either for by the 
        // main application or in context of unit test testing
        var logLevel = (config.logLevel) ? config.logLevel : 'info';

        // @todo: If you specify a directory within your config that does not 
        // yet exist the app will throw an error...fix that.
        // @todo: Make sure configured logDirs append a /
        var logDir = (config.logDir) ? config.logDir : './';
        
        var logStreams = [];
        if (config.logToFile)
        {
            logStreams.push(
            {
                level: config.logLevel,
                type: 'rotating-file',
                path: logDir + componentName + '.log',
                period: '1d',   // daily rotation
                count: 3        // keep 3 back copies
            });
        }
        if (config.logToScreen)
        {
            logStreams.push(
            {
                level: config.logLevel,
                stream: process.stderr
            });
        }
        logger = bunyan.createLogger({
            name: componentName,
            level: config.logLevel,
            streams: logStreams
        });
    }
    return logger;
};

/***************************************************************************
 * Does a HTTP POST request (i.e. access the REST service)
 *
 * @param {string} method      The HTTP method: GET | POST.
 * @param {string} url         The url of the REST service.
 * @param {Object} header      The fields to set in the HTTP header.
 * @param {Object} body        The content body to be sent to the service. In this
 *                             case, the sequence node request JSON.
 * @param {boolean} opt_isJson When set to true, it will parse the result body.
 *
 * @return {Promise} The object that represents the outcome of this asynch 
 *                   operation.
 *                   The successful data of the promise callback contains
 *                   the JSON object representing the sequence node.
 *
 ****************************************************************************/
module.exports.requestHttpDeferred = function (method, url, header, body, opt_isJson) {
    var deferred = Q.defer();

    if (opt_isJson === undefined)
    {
        opt_isJson = true;
    }

    // Notice that the json=true converts the response body's literal JSON into object
    var options = {
        method: method,
        uri:url,
        json:opt_isJson,
        headers: header,
        body: body
    };
console.log(options);
    request(options, function (error, response, body) {
        var errorPayload = {};
console.log(body);
        // For network error, error object is not null but is a string with error message.
        if (error !== null) {
            /*errorPayload = module.exports.createErrorObject(
                "E-BES001", 900, {origin: url, description: body}, error);*/
            deferred.reject(errorPayload);
        }
        // If server returned body with error object. (CorrectnessEngine)
        else if (body && body.error && _.isObject(body.error))
        {
            //errorPayload = syserror.SysError.createFromObject(body.error);
            if (errorPayload === null)
            {
                // If the body.error is an unrecognized error, create a new object and 
                // assign the body.error to the description 
                /*errorPayload = module.exports.createErrorObject(
                    "E-BES002", response.statusCode, {origin: url, description: body.error}, http.STATUS_CODES[response.statusCode]);*/
            }
            deferred.reject(errorPayload);
        }
        // If server did not return error object but status is 4xx 
        // It's a client error: client seems to have erred.
        else if (response.statusCode >= 400 && response.statusCode < 500 )
        {
            /*errorPayload = module.exports.createErrorObject(
                "E-REQ001", response.statusCode, {origin: url, description: body}, http.STATUS_CODES[response.statusCode]);*/
            deferred.reject(errorPayload);
        }
        // If server did not return error object but status is 4xx 
        // It's a server error: server is aware that it has erred or is incapable of 
        // performing the request
        else if (response.statusCode >= 500)
        {
            /*errorPayload = module.exports.createErrorObject(
                "E-BES002", response.statusCode, {origin: url, description: body}, http.STATUS_CODES[response.statusCode]);*/
            deferred.reject(errorPayload);
        }
        else
        {
            deferred.resolve(body);
        }
    });

    return deferred.promise;
};

