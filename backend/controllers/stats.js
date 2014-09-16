var _ = require('lodash');
var Category = require('./../models/category');
var Company = require('./../models/company');
var Exercise = require('./../models/exercise');
var express = require('express');
var Promise = require('bluebird');
var Question = require('./../models/question');
var Result = require('./../models/result');
var router = express.Router();
var Training = require('./../models/training');

/**
 * Retrieve the average of a leaf, based on the questions that have been answered for that leaf
 * through the exercises.
 *
 * @param {Object} 	leaf 	The current leaf that is being worked on.
 * @param {Object} 	meta 	The data passed in that allows statistics to be generated.
 * @return {Number} 		Average of the leaf
 */
function leafAverage (leaf, meta) {
    // There is an array of training exercises, we want to retrieve all
    // the results from questions and calculate an average. We chain this
    // through lodash by first getting all the questions, then flattening
    // them into one single array and filtering the unanswered questions.

    var questions = _(meta.exercises)
            .pluck('results')
            .flatten()
            .filter(function (result){
                return result.question.path === leaf.path + leaf.id + ',';
            })
            .value();

    var answeredCorrect = _.where(questions, {result: true}).length;
    var answeredTotal = questions.length;

    // Calculate the average of the correct/total then multiply the decimal by 100
    // for a whole number.
    var avg = Math.round((answeredCorrect / answeredTotal).toFixed(2) * 100);
    avg = avg || -1;

    var childrensAverage = 0;
    var selfPercentage = 1.0;
    // Get the average of our leaves.
    if (leaf.children.length){
        // Filter our categories that have 0 scores.
        var scoredCategories = _.filter(leaf.children, function (item){
            return item.stats.leafAverage > 0;
        });

        // Get the sum of all of our children who have scores.
        var averageSums = _.reduce(scoredCategories, function (sum, item){
            return sum + item.stats.leafAverage;
        }, 0);

        // Get the average of those said children.
        childrensAverage = Math.round(averageSums / (scoredCategories.length * 100) * 100);

        // Childrens scores will weight for 50%, have the current leafs total average as
        // .5 * selfAverage + .5 * childrensAverage
        selfPercentage - 0.5;
    }

    if (avg > -1){
        avg = Math.round(avg * selfPercentage) + Math.round(childrensAverage * 0.5);
    } else if (avg < 0 && childrensAverage > 0){
        avg = childrensAverage;
    }

    return avg;
}

/**
 * Calculate the data that will be displayed on the top of the dash.
 *
 * @param {Array.<Exercise>} exercises The exercises for the given training course.
 * 
 * @return {Object}
 */
function examStats (exercises){
    var result = {};

    // Find all exercises that have been completed.
    var all = _.where(exercises, function (exercise){
        return exercise.completed !== null;
    });

    // Find all exercises that have been completed and failed.
    result.failCount = _.where(all, function (exercise){
        return exercise.score <= 65;
    }).length;

    // Find all exercises that have been completed and passed.
    result.passCount = _.where(all, function (exercise){
        return exercise.score > 65;
    }).length;
    
    // Calculate the average of all exams that have been completed.
    var totalEarnedPoints = _.reduce(all, function (sum, exercise){
        return sum += exercise.score; 
    }, 0);

    // Get the exam average by doing totalEarnedPoints / totalPossiblePoints
    result.examAverage = Math.round((totalEarnedPoints / (all.length * 100)).toFixed(2) * 100);

    return result;
}

/**
 * Contains the routes that have custom handling logic.
 * @type {Object}
 */
var stats = {
    get:{
        /**
         * Api call intended to provide a summary of data for a training course,
         * returning a tree of data based on the categories for that training course.
         * Each leaf in the tree will have an object called 'stats' that will contain
         * calculated averages and statistics based off the current users' past
         * exercises.
         *
         * @param {Express.request} req Express application request object.
         * @param {Express.response} res Express application response object.
         */
        tree: function (req, res){
            var user = res.locals.user;
            
            if (!user || !_.any(user.access)){
                return res.send(200, '');
            }

            var trainingIds = _.pluck(user.access, 'trainingId');
            var promises = [
            	Category.findAll({where: {trainingId: trainingIds}}),
            	Exercise.findAll({where: {userId: user.id, trainingId: trainingIds}, 
            		include: [{model: Result, include: [Question]}]}),
            	Training.findAll({where: {id: trainingIds}, include: [Company]}, {raw: true})
            ];

            Promise.all(promises).then(function (results){
            	/**
            	 * Results is the resolves promises above, broken apart from eager loading to
            	 * optimize the time of the query.
            	 *
            	 * results[0]: Categories for all trainings the user has access to.
            	 * results[1]: Exercises for all trainings the user has access to.
            	 * results[2]: Training courses the user has access to.
            	 */
            	var categories = results[0];
            	var exercises = results[1];
            	var trainings = results[2];

                var Tree = require('./../treehelper');

                if (!trainings.length){
                    return res.send(200, '');
                }
                // The functions to apply to each leaf of the tree;
                var applyFunctions = [{key: 'leafAverage', fn: leafAverage}];

                // Convert the categories for the training into a tree.
                _.each(trainings, function(training){
                	var trainingCategories = _.where(categories, {trainingId: training.id});
                	var trainingExercises = _.where(exercises, {trainingId: training.id});

                    if (!trainingCategories.length) return;

                	// Load our category into the parent-child structure.
                	var tree = new Tree(null /* id */, ',', trainingCategories, {
                        training: training,
                        exercises: trainingExercises
                    });

                	// What functions do we want to run on each leaf of the tree.
                	tree.treeApply(applyFunctions);

                    // Stats to display at the top of the dash.
                    training.stats = examStats(trainingExercises);

                    // Set how many courses are available to the user.
                    training.stats.courseCount = trainings.length;

                	// Set our parent-child formatted category as the root for the tree.
                	training.category = tree.get();
                });

                // Send the data as a script, to be executed on the DOM.
                res.send('window.Trainify.initCourseData(' + JSON.stringify(trainings) + ')');
            });
        }
    }
};

// Express route '/api/stats/tree'
router.route('/tree')
    .get(stats.get.tree);

module.exports = router;
module.exports.tree = stats.get.tree;