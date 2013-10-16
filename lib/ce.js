/* **************************************************************************
 * $Workfile:: ce.js                                                        $
 * *********************************************************************/ /**
 *
 * @fileoverview ce contains the handler for the controller route.
 *               It takes the full payload from the IPS and farms that out
 *               to the appropriate assessmentHandler, handing return 
 *               data back to the controller, including correctness,
 *               feedback, and correctAnswer (as appropriate).
 *
 * Created on       Oct 11, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
var Q = require('q');
var _ = require('underscore');
var config = require('config');
var utils = require('./utils');

// assessmentType Handlers
// NOTE: We could consider using https://npmjs.org/package/require.async to load these 
// instead.  I'm not sure what the performance implications are.
var assessmentHandlers = {
    'alwayscorrect': require('./types/alwayscorrect'),
    'multiplechoice': require('./types/multiplechoice')
};


/* **************************************************************************
 * CE class                                                           */ /**
 *
 * @constructor
 *
 * @classdesc
 * The Correctness Engine exposes a processSubmission method to handle
 * student submissions.  
 *
 ****************************************************************************/
module.exports.CE = function() {

    var logger = utils.getLogger(config, 'ce');

    var that_ = this;

    /**
     * Receives a payload from the controller, containing answerKey,  
     * studentSubmission, and isLastAttempt, and farms that out to the 
     * appropriate answerType hander.
     * If isLastAttempt the handler will also return the correctAnswer.
     * Handlers return correctness, feedback, and correctAnswer, as appropriate.
     * 
     * @param  {object}   payload  An object containing the data payload.
     * @param  {Function} callback Callback with signature fn(error, results),
     *                             where results will contain correctness,
     *                             feedback, and correctAnswer
     */
    this.processSubmission = function(payload, callback) {
        var assessmentType = payload.answerKey.assessmentType;
        if (!(assessmentType in assessmentHandlers))
        {
            callback("The assessmentType '" + assessmentType + "' can not be processed by this Correctness Engine", null);
            return;
        }
        // Allows us to get at this from within our handler if we so desire.
        // NOTE: I've read this is against best practices, we may want to reconsider this.
        var handler = _.bind(assessmentHandlers[assessmentType], that_);
        handler(payload, callback);
    };
};