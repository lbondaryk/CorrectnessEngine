/**
 * Hitting the Turing's Craft API to get all exercizes.
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

// uses 'local' config
var config = require('config');

var request = require('request');
var crypto = require('crypto');


//var exerciseId = "00000-10001";
var exerciseId = "00000-10629";

var op = "getSolutions";
var timestamp = (new Date).getTime();

// TuringsCraft endpoint and authentication
var tcUrl = config.turingsCraft.baseUrl + "/codelab/jsp/api/api.jsp";
var apiKey = config.turingsCraft.apiKey;
var apiSecret = config.turingsCraft.apiSecret;

// build apiSig to this scheme:
//   hash( hash(api_secret) + hash( hash(api_secret) + message ) )

var message = apiSecret + '-' + 'api_key=' + apiKey + 'exssn=' + exerciseId + 'op=' + op + 'timestamp=' + timestamp;

var hashedApiSecret = hash_(apiSecret);
var apiSig = hash_( hashedApiSecret + hash_( hashedApiSecret + message));

var fullUrl = tcUrl + '?op=' + op + '&api_key=' + apiKey + '&timestamp=' + timestamp + '&api_sig=' + apiSig + '&exssn=' + exerciseId;
      
var headers = {
    'content-type': 'application/json;charset=UTF-8'
};

var options = {
    url: fullUrl,
    headers: headers,
    encoding: "UTF-8"
};
// Send submission to TuringsCraft server
request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        parsedBody = JSON.parse(body);

        console.log('Return data from TuringsCraft:');
        console.log(parsedBody);

    } else {
        // @todo - do this up.
        console.log("got an error");
        console.log(error); // this is null in this case
        console.log(body) // the error message returns in the body, not an error
        //deferred.reject(error);
    }
});

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