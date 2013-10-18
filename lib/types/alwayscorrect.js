/* **************************************************************************
 * $Workfile:: alwayscorrect.js                                            $
 * *********************************************************************/ /**
 *
 * @fileoverview An assessmentType that always returns correct.
 *
 * Created on       Oct 15, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
var config = require('config');
var utils = require('../utils');


/* **************************************************************************
 * alwayscorrect class                                                 */ /**
 *
 * @constructor
 *
 * @classdesc
 * Does some stuff...
 *
 ****************************************************************************/
module.exports.AssessmentHandler = function() {

    var logger = utils.getLogger(config, 'multiplechoice');

    /**
     * Receives payload
     * 
     * @param  {[type]}   payload  [description]
     * @param  {Function} callback [description]
     */
    this.assess = function(payload, callback) {
        var returnData = {
            "correctness": 1,
            "feedback": {"thing": "alwayscorrect is indeed always correct."},
            "correctAnswer": {"answerKey": null}
        };
        callback(null, returnData);
    };
};