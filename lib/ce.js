/* **************************************************************************
 * $Workfile:: ce.js                                                        $
 * *********************************************************************/ /**
 *
 * @fileoverview ce contains the handler for the controller routes.
 *               It takes an answerKey and a studentSubmission, farms those
 *               out to the appropriate answerType handler, and returns
 *               the response data to the controller.
 *
 * Created on       Oct 11, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
var Q = require('q');
var config = require('config');
var utils = require('./utils');


/* **************************************************************************
 * CE class                                                           */ /**
 *
 * @constructor
 *
 * @classdesc
 * The CE exposes a method to handle student submissions  
 *
 ****************************************************************************/
module.exports.CE = function() {

    var logger = utils.getLogger(config, 'ce');

    var that_ = this;

    /**
     * Receives a payload from the controller containing answerKey and 
     * submission, farms those out to the appropriate answerType hander,
     * and returns the appropriate result object.
     * 
     * @param  {object}   payload  An object containing...
     * @param  {Function} callback Callback with signature fn(error, results),
     *                             where results will contain...
     */
    this.processSubmission = function(payload, callback) {
        var result = {"one": "loneliest number"};
        callback(null, result);
    };
};