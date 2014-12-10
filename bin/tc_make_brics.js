/**
 * Taking the exercise data from Turing's Craft and turning them into Brix activities.
 */

var fs = require('fs');


// name of file with the exercise data
// var exercisesfilename = "tc_exercise_files/tc_exercises_c.json";
// var exercisesfilename = "tc_exercise_files/tc_exercises_java.json";
var exercisesfilename = "tc_exercises-massaged.json";

// name of template file for codequestion bric
var templatefilename = "codequestiontemplate.json";
// the template as a JSON object
var template;

// name of the directory to hold the activity JSON files
var dirname = "tc_brix_activities";

// prefix for the exercise title in the bric config
// var titleprefix = "Java Programming Language Exercise ";
var titleprefix = "C Programming Language Exercise ";


// array to hold the exercise data
var exerciseData = [];

// array to hold the activity configurations
var activities = [];


// make the activities from the exercise data and store in an array
makeActivities();
// write the activity configurations to JSON files
makeFiles();


/**
 * makeActivities uses the exercise data from Turing's Craft to construct
 * the Brix activity configurations and then stores them in an array.
 */
function makeActivities()
{
    try {
        var contents = JSON.parse(fs.readFileSync(exercisesfilename));
    } catch (err) {
        console.log("makeActivities(): Cannot find file: " + exercisesfilename);
        return;
    }
    try {
        template = JSON.parse(fs.readFileSync(templatefilename));
    } catch (err) {
        console.log("makeActivities(): Cannot find file: " + templatefilename);
        return;
    }
    activities = contents.map(makeActivity);
    console.log("Created " + activities.length + " activities.");
}

/**
 * makeActivity constructs a single activity from the given exercise data.
 * @param  {!Object} item
 *      The JSON object containing the exercise data
 * @return {!Object}
 *      The JSON object representing the activity configuration
 */
function makeActivity(item)
{
    // get exercise data
    var exerciseId = item.exssn;
    var exercise = item.instructions;
    var solutions = item.solutions;

    // clone the template to make a new activity
    var activity = JSON.parse(JSON.stringify(template));

    // make objects that we will need for the brix config
    var title = titleprefix + exerciseId;
    var codeExamples = solutions.map(function(solution) {
        solution = solution.trim();
        var code = solution.split("\n");
        var codeExample = {
            "code": code
        }
        return codeExample;
    });

    // update the contents of the activity configuration
    activity.containerConfig[0].brixConfig[0].config.title = title;
    activity.containerConfig[0].brixConfig[0].config.exercise = exercise;
    activity.containerConfig[0].brixConfig[0].answerKey.answers.exerciseId = exerciseId;
    activity.containerConfig[0].brixConfig[0].answerKey.answers.codeExamples = codeExamples;

    return activity;
}

/**
 * makeFiles takes the activity configurations and writes each one to a JSON file.
 */
function makeFiles()
{
    if (!fs.existsSync(dirname))
    {
        fs.mkdirSync(dirname);
    }
    activities.map(function(activity) {
        var exerciseId = activity.containerConfig[0].brixConfig[0].answerKey.answers.exerciseId;
        var newfilename = dirname +"/" + "exercise-" + exerciseId + ".json";
        fs.writeFileSync(newfilename, JSON.stringify(activity, null, 4));
    });
}

