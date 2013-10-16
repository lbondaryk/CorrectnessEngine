/* **************************************************************************
 * $Workfile:: multiplechoice.js                                            $
 * *********************************************************************/ /**
 *
 * @fileoverview Multiplechoice assessmentTypes are managed herein.
 *
 * Created on       Oct 15, 2013
 * @author          Seann Ives
 *
 * @copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/
var config = require('config');
var Q = require('Q');
var utils = require('../utils');


/* **************************************************************************
 * MC class                                                           */ /**
 *
 * @noIdeaHowToAnnotateThisMikeHelp
 *
 * @classdesc
 * Deal with multiple choice assessmentTypes.  
 *
 ****************************************************************************/
module.exports = function multiplechoice(data, callback) {

    var logger = utils.getLogger(config, 'multiplechoice');

    var deferred = Q.defer();

    var answers = data.answerKey.answers;
    var studentSubmission = data.studentSubmission;
    var isLastAttempt = data.isLastAttempt;

    test1_()
    .then(function(){
         var returnData = {
            "correctness": 0,
            "feedback": {"thing": "mc is great"},
            "correctAnswer": {"answerKey": "option0001"}
        };
        callback(null, returnData);
    })
    .catch(function (error) {
        callback(error, null);
    })
    .done();


   
};

function test1_() {
    var deferred = Q.defer();

    console.log("   IN test1");
    deferred.resolve();
    return deferred.promise;
}