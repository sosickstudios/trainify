var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var mixin = require('utils-merge');

var app = {};

/**
 * A list of the types of data trees that the application is compatible with.
 *
 * @type {Object}
 */
app.TREE_TYPES = {
    CHAPTER: 'chapter',
    MATRIX: 'matrix',
    LEGEND: 'legend'
};

/**
 * Initialize the Generation System
 *
 * @param {Object} data Data that will be used in trees and locally.
 * 
 * @return {App} Return application context for chaining purposes.
 */
app.init = function(data) {
    // Give app events prototype for emitting.
    mixin(app, EventEmitter.prototype);

    // Data passed in for system.
    this.data = data;

    // Load all trees that there is data for.
    this.trees = this.loader(data);

    // Emitted Error
    this.on('error', function (e){
        // This would be a great place to set a mongodb logger;
        console.log(e);
    });

    // Return for simple chaining to second function call.
    return this;
};

/**
 * Generate an exercise for a given TREE_TYPES by calling the trees' TREE.exercise function.
 *
 * @param {TREE_TYPES} tree Which tree to generate exercise questions for. [Chapter, Legened, Matrix]
 * @param {String} category Id of category to generate exercise for.
 * @param {Number} total Amount of questions to generate.
 * @param {tree.EXERCISE_TYPES} type Exercise type [Exam Prep, Practice]
 * @param {tree.PULLER} puller Specify way questions should be pulled. [Absolute, Relative]
 * 
 * @return {Array.<Question>} Questions that have been generated for exercise.
 */
app.exercise = function (tree, category, total, type, puller) {
    tree = this.trees[tree];

    if (!tree){
        this.emit('error', new Error('Gen System - Tree Requested doesn\'t exist.'));
    }

    if (!total){
        var practiceTotal = this.data.training.practiceExamTotal;
        var structuredTotal = this.data.training.structuredExamTotal;
        total = type === tree.EXERCISE_TYPES.EXAMPREP ? structuredTotal : practiceTotal; 
    }

    return tree.exercise(category, total, type, puller);
};

/**
 * Array of TREE_TYPES that are loaded on the app.
 *
 * @return {Array.<TREE_TYPES>}
 */
app.getLoadedTrees = function (){
    return Object.keys(this.trees);
};

/**
 * Determine what trees are represented in our data.categories and load them.
 *
 * @param {Object} data Arbitrary data sent in for use in each trees' functions.
 * 
 * @return {Object} Object containing the newly loaded trees, described by their types.
 */
app.loader = function (data){
    // Determine what trees there is data for.
    var treeTypes = _(data.categories)
        .pluck('identifier')
        .uniq()
        .value();

    var content = {};
    treeTypes.forEach(function (tree){
        content[tree] = require('./treemodels/' + tree)(data);
    }, this);

    return content;
};

/**
 * Run stats over given/loaded trees by calling Tree.stats()
 *
 * @param {Array.<String>} trees Strings that represent the data trees that the function should run
 *                               the appliers on.
 * 
 * @return {Object} Object containing data trees that have stats on each node.
 */
app.stats = function (trees){
    // If there are no trees sent in, run over all loaded trees. (DEFAULT)
    if (!trees || !trees.length){
        trees = this.getLoadedTrees();
    }

    var stats = {};
    trees.forEach(function (tree){
        // See if tree is loaded.
        var loadedTree = this.trees[tree];

        if(!loadedTree){
            this.emit('error', new Error('Gen System - Tree Not Loaded.'));
        } else {
            // Call stats function for tree if it does indeed exist.
            stats[tree] = loadedTree.stats(); 
        }
    }, this);

    return stats;
};

/**
 * Initialize our generation system.
 *
 * @param {Object} data Data to be passed to application for use.
 * 
 * @return {Application}
 */
function initialize(data){
    // Initialize our Generation System application.
    app.init(data);
    
    // Return for use.
    return app;
}

module.exports = exports = initialize;