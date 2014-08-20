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
    return avg;
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

                	// Load our category into the parent-child structure.
                	var tree = new Tree(null /* id */, ',', trainingCategories, { training: training, exercises: trainingExercises });

                	// What functions do we want to run on each leaf of the tree.
                	tree.treeApply(applyFunctions);

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