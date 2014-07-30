var _ = require('lodash');
var Answer = require('./../models/answer');
var Category = require('./../models/category');
var Exercise = require('./../models/exercise');
var Training = require('./../models/training');
var Promise = require('bluebird');
var express = require('express');
var router = express.Router();

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
	var questions = _(meta.training.exercises).pluck('questions').flatten().filter(function (item) {
		return leaf.path && item.content && (item.content.path === (leaf.path + leaf._id + ','));
	}).value();

	var answeredCorrect = _.where(questions, {result: true}).length;
	var answeredTotal = questions.length;

	// Calculate the average of the correct/total then multiply the decimal by 100
	// for a whole number.
	var avg = Math.round((answeredCorrect / answeredTotal).toFixed(2) * 100);
	avg = avg || -1;
	return avg;
}

/**
 * Will traverse a data tree from the bottom to the top, applying a set of functions
 * to each leaf along the way. 
 *
 * @param 	{[Object.<String, Function>]} fns 	An object containing an array of objects with a field name and function, 
 *                        	used for attaching the calculated data to each leaf.
 * @param 	{Object} leaf 	The current leaf that is being worked on.
 * @param 	{Object} meta 	Data that can be accessed from each leaf being worked on, used for calculating averages.
 * @return 	{Object} Returns a category data tree in the parent-child format with calculated statistics on each leaf.
 */
function treeParser (fns, leaf, meta) {
  // Work the tree from the bottom up, so that we may have children functions run first for stats.
  // Call all children recursively.
  if(leaf.children && leaf.children.length) { 
    leaf.children = _.map(leaf.children, function (item) {
      return treeParser(fns, item, meta);
    });
  }

  leaf.stats = {};
  _.each(fns, function (item) {
    leaf.stats[item.key] = item.fn(leaf, meta);
  });

  return leaf;
}

/**
 * Returns a function that can be called recursively for recusively eager loading
 * nested associations using sequelizes set up getters. This method will return a tree of data,
 * that has a children field attached if there are any existent.
 *
 * @param {Object}   item The object that has relations to load.
 */
function childrenLoader(item){
	var deferred = Promise.defer();

    item.getChildren().then(function (result){
      if(result.length){
        Promise.all(_.map(result, function (child) {
        	return childrenLoader(child);
        })).then(function (children){
        	// Set the values of the children downstream to our object.
        	item.dataValues.children = children;
 			deferred.resolve(item);
        });
      } else {
      	deferred.resolve(item);
      }
    });

    return deferred.promise;
};

/**
 * Contains the routes that have custom handling logic.
 * @type {Object}
 */
var stats = {
	get:{
		tree: function (req, res){
			var user = res.locals.user;

			Training.find({ where: {id: _.pluck(user.access, 'trainingId')}, include: [{model: Category}, {model: Exercise, include: [ Answer ]}]})
				.then(function (training){
					// Convert the training category into the parent-child tree format.
					childrenLoader(training.category)
						.then(function (result){
							// The functions to apply to each leaf of the tree;
							var applyFunctions = [{key: 'leafAverage', fn: leafAverage}];

							// The data that will be copied to each leaf, so that stats may be applied.
							var leafData = training;

							// Run our functions over each leaf in the tree.
							results = treeParser(applyFunctions, result, leafData);

							//Send the data as a script, to be executed on the DOM.
							res.send('window.createVisualization(' + JSON.stringify(result) + ')');
						});
					
				});
		}
	} 
};

// Express route '/api/stats/tree'
router.route('/tree')
	.get(stats.get.tree);

module.exports = router;