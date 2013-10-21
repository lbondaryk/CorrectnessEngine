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
 * Very simple.  Always returns correct.
 *
 ****************************************************************************/
function AssessmentHandler()
{
    var logger = utils.getLogger(config, 'multiplechoice');

    /**
     * Receives payload
     * 
     * @param  {object}   payload  Payload from the POST
     * @param  {function} callback Return data object
     */
    this.assess = function(payload, callback) {
        var returnData = {
            "correctness": 1,
            "feedback": {"thing": "alwayscorrect is indeed always correct."},
            "correctAnswer": null
        };
        callback(null, returnData);
    };
}

/**
 * Export createAssessmentHandler.  Every Assessment Handler should export this though
 * the details within can vary by assessment type.
 * @param  {object} options For creation options
 * @return {object}         AssessmentHandler object
 */
module.exports.createAssessmentHander = function createAssessmentHander(options)
{
    return new AssessmentHandler(options);
};