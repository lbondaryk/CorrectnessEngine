/* **************************************************************************
 * $Workfile:: alwayscorrect.js                                            $
 * *********************************************************************/ /**
 *
 * @fileoverview A test assessmentType that always returns correct.
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
 * Alwayscorrect function                                              */ /**
 *
 * @function
 *
 * @classdesc
 * Always Correct exposes a function that always returns correct.  
 *
 ****************************************************************************/
module.exports = function(data, callback) {

    var logger = utils.getLogger(config, 'alwayscorrect');
    
    var returnData = {
        "correctness": 1,
        "feedback": {"thing": "alwayscorrect is indeed always correct."},
        "correctAnswer": {"answerKey": null}
    };
    callback(null, returnData);
};