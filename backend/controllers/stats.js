var _ = require('lodash');
var Answer = require('./../models/answer');
var Category = require('./../models/category');
var Exercise = require('./../models/exercise');
var Training = require('./../models/training');
var Promise = require('bluebird');

/**
 * Retrieve the average of a leaf, based on the questions that have been answered for that leaf 
 * through the exercises.
 *
 * @param {Object} 	leaf 	The current leaf that is being worked on.
 * @param {Object} 	meta 	The data passed in that allows statistics to be generated.
 * @return {Number} 		Average of the leaf
 */
function leafAverage (leaf, meta) {
  var questions = _(meta.training.exercises).pluck('questions').flatten().filter(function (item) {
    return leaf.path && item.content && (item.content.path === (leaf.path + leaf._id + ','));
  }).value();

  var avg = Math.round((_.where(questions, {result: true}).length / questions.length).toFixed(2) * 100);
  avg = avg || -1;
  return avg;
}

/**
 * Will traverse a data tree from the bottom to the top, applying a set of functions
 * to each leaf along the way. 
 *
 * @param 	{[Object]} fns 	An object containing an array of objects with a field name and function, 
 *                        	used for attaching the calculated data to each leaf.
 * @param 	{Object} leaf 	The current leaf that is being worked on.
 * @param 	{Object} meta 	Data that can be accessed from each leaf being worked on, used for calculating averages.
 * @return 	{Object} Returns a category data tree in the parent-child format with calculated statistics on each leaf.
 */
function treeParser (fns, leaf, meta) {
  //Work the tree from the bottom up, so that we may have children functions run first for stats.
  //Call all children recursively.
  if(leaf.children && leaf.children.length) { 
    leaf.children = _.map(leaf.children, function (item) {
      return treeParser(fns, item, meta);
    });
  }

  //Execute all passed in functions, that should be in format [{key: 'String', fn: function}]
  leaf.stats = {};
  _.each(fns, function (fn) {
    leaf.stats[fn.key] = fn.fn(leaf, meta);
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

var stats = {
	treeGet: function (req, res){
		var user = res.locals.user;
		Training.find({ where: {id: _.pluck(user.access, 'trainingId')}, include: [{model: Category}, {model: Exercise, include: [ Answer ]}]})
			.then(function (training){
				childrenLoader(training.category)
					.then(function (result){
						//Send the data as a script, to be executed on the DOM.
						res.send('window.createVisualization(' + JSON.stringify(result) + ')');
					});
				
			});

		
	}

};


module.exports = stats;