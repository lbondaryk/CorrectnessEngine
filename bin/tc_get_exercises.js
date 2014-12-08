/**
 * Hitting the Turing's Craft API to get all exercizes and then another
 * to get the solutions.
 * Docs here: https://devsrv5.turingscraft.com:39184/codelab/jsp/api/docs/
 *
 * From Phil Dreizen:
 * There is a hidden op, not in the documentation, for this.
"getSolutions" will return an array of our "canonical" solutions.  (We
sometimes have "alternate" solutions, thus the array.  The first
solution in the array is the "one true answer").

There's an issue of authorization in this case.  The API user must
have authorization to make this call.  I believe the API user you are
currently using does have the ability to make this call.

getSolutions requires one additional parameter:  "exssn" -- the exssn
of the exercise you want the solution for.
 */

var Q = require('q');
var fs = require('fs');
// uses 'local' config
var config = require('config');

var request = require('request');
var crypto = require('crypto');

var filename = "tc_exercises.json";

// unnecessary
//var exerciseId = "00000-10001";
//var exerciseId = "00000-10629";

// My array of exercises, destined to contain solutions
var exercisesAry = [];

// This would get all your stuff.  Once you've got it
// on the filesystem, comment this out and then run
// the data massager thing.
//getAllTheTCStuff();

// This writes a new file of massaged data once
// you've got the stuff from TC.
// Eventually you could merge these two things so they
// massage as they're getting, but we're doing this
// this way during development.
massageAllMyData();

/**
 * This gets all the TC stuff and shoves it in whatever you set
 * above as filename.
 * @return {[type]} [description]
 */
function getAllTheTCStuff(){
    makeRequest(getOptions())
    .then(function (body) {
        var parsedBody = JSON.parse(body);
        exercisesAry = parsedBody.exercises;

        return Q.all(exercisesAry.map(function(item) {
            //return addSolution(item);
            return makeRequest(getOptions(item.exssn))
                   .then(function (solnbody) {  
                        var parsedSolnBody = JSON.parse(solnbody);
                        //console.log(parsedSolnBody);
                        item.solutions = parsedSolnBody.solutions;
                        return;
                   });
        }));
    })
    .then(function() {
        //console.log(exercisesAry);
        fs.writeFileSync(filename, JSON.stringify(exercisesAry, null, 4));
        console.log('All done with # exercises ' + exercisesAry.length );
    })
    .catch(function (error) {
        // Handle any error from all above steps
        console.log("Promise returned an error.");
    })
    .done();
}

/**
 * make an http request.  give it some options and it returns you stuff.
 * generic, not TC specific.
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function makeRequest(options){
    var deferred = Q.defer();

    // Send submission to TuringsCraft server
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            deferred.resolve(body);

        } else {
            console.log("got an error");
            console.log(error); // this is null in this case
            console.log(body) // the error message returns in the body, not an error
            deferred.reject(body);
        }
    });
    return deferred.promise;

}

/**
 * getOptions constructions the options you wanna send to makeRequest.
 * This is tc specific.  If you send exerciseId then you wanna do a 
 * getSolutions call.  It does getAllExercises otherwise.
 * @param  {[type]} exerciseId [description]
 * @return {[type]}            [description]
 */
function getOptions(exerciseId){

    // if we have an exerciseId, it's getSolutions, otherwise getAllExercises 
    var op = exerciseId ? "getSolutions" : "getAllExercises";

    var timestamp = (new Date).getTime();

    // TuringsCraft endpoint and authentication
    var tcUrl = config.turingsCraft.baseUrl + "/codelab/jsp/api/api.jsp";
    var apiKey = config.turingsCraft.apiKey;
    var apiSecret = config.turingsCraft.apiSecret;

    // build apiSig to this scheme:
    //   hash( hash(api_secret) + hash( hash(api_secret) + message ) )

    var message = '';
    if (op === 'getAllExercises') {
        message = apiSecret + '-' + 'api_key=' + apiKey + 'op=' + op + 'timestamp=' + timestamp;
    } else {
        message = apiSecret + '-' + 'api_key=' + apiKey + 'exssn=' + exerciseId + 'op=' + op + 'timestamp=' + timestamp;
    }

    var hashedApiSecret = hash_(apiSecret);
    var apiSig = hash_( hashedApiSecret + hash_( hashedApiSecret + message));

    var fullUrl = '';
    if (op === 'getAllExercises') {
        fullUrl = tcUrl + '?op=' + op + '&api_key=' + apiKey + '&timestamp=' + timestamp + '&api_sig=' + apiSig;
    } else {
        fullUrl = tcUrl + '?op=' + op + '&api_key=' + apiKey + '&timestamp=' + timestamp + '&api_sig=' + apiSig + '&exssn=' + exerciseId;
    }
     
    var headers = {
        'content-type': 'application/json;charset=UTF-8'
    };

    var options = {
        url: fullUrl,
        headers: headers,
        encoding: "UTF-8"
    };
    return options;
}

/**
 * This grabs the file referenced in filename, messes around with it,
 * and make a new massaged file.
 * @return {[type]} [description]
 */
function massageAllMyData(){
    var contents = JSON.parse(fs.readFileSync(filename));

    contents.map(massageProblem);

    var newFilename = filename.replace(/\.json/, "-massaged.json");
    fs.writeFileSync(newFilename, JSON.stringify(contents, null, 4));
    console.log("Done massaging the data.");
}

/**
 * This massages a single problem in the overall array.
 *
 * Rules are defined here:
 * https://docs.google.com/a/pearson.com/document/d/1SH308kPiTlimSGLjTJcW5ugsPikdq2Tlxl7lz6GxhYk/edit
 * 
 * @param  {[type]} item [description]
 * @return {[type]}      [description]
 */
function massageProblem(item){
    var inst = item.instructions;

    inst = inst.replace(/<BR>/gi, "<br/>");
    inst = inst.replace(/&nbsp;/g, "&#x00a0;");

    inst = inst.replace(/<P CLASS/gi, "<div class");
    inst = inst.replace(/<\/P>/g, "</div>");

    inst = inst.replace(/<SPAN CLASS/g, "<span class");
    inst = inst.replace(/<\/SPAN>/g, "</span>");

    inst = inst.replace(/<B>/gi, "<b>");
    inst = inst.replace(/<\/B>/gi, "<\/b>");

    inst = inst.replace(/\/\/@ Instructions(\n)*/, "");
    inst = inst.replace(/\/\/@(\n)*/, "");

    inst = inst.replace(/<UL CLASS=mainlist/gi, "<ul class=\"taskList\"");
    inst = inst.replace(/<UL>/g, "<ul>");
    inst = inst.replace(/<\/UL>/g, "</ul>");

    inst = inst.replace(/<LI CLASS=mainlist/gi, "<li class=\"taskList\"");
    inst = inst.replace(/<LI>/g, "<li>");
    inst = inst.replace(/<\/LI>/g, "</li>");

    inst = inst.replace(/<FONT FACE='(\w)*' SIZE='(\d)*' COLOR='#(\w)*'>/gi, "<span class=\"code\">");
    inst = inst.replace(/<\/FONT>/g, "</span>");

    // may want to run a generic named-to-numeric entity converter here.
    //console.log(inst);
    //console.log(JSON.stringify(inst));
    item.instructions = inst;
    return item;
}

/**
 * Create a sha256 hash
 * @param  {[type]} message [description]
 * @return {[type]}         [description]
 */
function hash_(message)
{
    var c = crypto.createHash('sha256');
    c.update(message);
    var buf = c.digest();
    return buf.toString('hex');
}