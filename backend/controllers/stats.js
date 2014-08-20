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

    var questions = _(meta.training.exercises)
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

			
			Training.find({where: {id: _.pluck(user.access, 'trainingId')}, 
				include:[Category, { model: Exercise, where: {userId: user.id}, 
					include: [{model: Result, include: [Question]}]}, Company]})
				.then(function (training){
					// TODO(Bryce)This Query takes an average of 1.3s, need to somehow 
					// optimize this in the future.
					
					var Tree = require('./../treehelper');

					// Load our category into the parent-child structure.
					var tree = new Tree(null /* Id */, ',', training.categories, { training: training });

					// The functions to apply to each leaf of the tree;
					var applyFunctions = [{key: 'leafAverage', fn: leafAverage}];

					// The data that will be copied to each leaf, so that stats may be applied.
					var leafData = training;
					
					// Drop the DAO instance to reduce memory useage.
					training = training.values;

					// What functions do we want to run on each leaf of the tree.
					tree.treeApply(applyFunctions);

					delete training.categories;
					delete training.exercises; 

					// Set our parent-child formatted category as the root for the tree.
					training.category = tree.get();

					// Send the data as a script, to be executed on the DOM.
					res.send('window.Trainify.initCourseData(' + JSON.stringify([training]) + ')');
				});
		}	
	},
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

            Training.find({where: {id: _.pluck(user.access, 'trainingId')},
                include:[Category, { model: Exercise, where: {userId: user.id},
                    include: [{model: Result, include: [Question]}]}, Company]})
                .then(function (training){
                    // TODO(Bryce)This Query takes an average of 1.3s, need to somehow
                    // optimize this in the future.

                    var Tree = require('./../treehelper');

                    if (!training){
                        return res.send(200, '');
                    }

                    // Load our category into the parent-child structure.
                    var tree = new Tree(null /* id */, ',', training.categories, { training: training });

                    // The functions to apply to each leaf of the tree;
                    var applyFunctions = [{key: 'leafAverage', fn: leafAverage}];

                    // Drop the DAO instance to reduce memory useage.
                    training = training.values;

                    // What functions do we want to run on each leaf of the tree.
                    tree.treeApply(applyFunctions);

                    delete training.categories;
                    delete training.exercises;

                    // Set our parent-child formatted category as the root for the tree.
                    training.category = tree.get();

                    // Send the data as a script, to be executed on the DOM.
                    res.send('window.Trainify.initCourseData(' + JSON.stringify([training]) + ')');
                });
        }
    }
};

// Express route '/api/stats/tree'
router.route('/tree')
    .get(stats.get.tree);

module.exports = router;