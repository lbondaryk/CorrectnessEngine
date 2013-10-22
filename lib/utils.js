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
