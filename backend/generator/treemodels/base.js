var _ = require('lodash');
var applier = require('./appliers');
var EventEmitter = require('events').EventEmitter;
var mixin = require('utils-merge');
var prioritizer = require('./prioritizers');

// Object to be inherited by each TreeModel
var base = module.exports = exports = {};

/**
 * Types of interpreters to use when pulling questions from a question pool.
 *
 * @type {Object}
 */
base.PULLER = {
    ABSOLUTE: 'absolute',
    RELATIVE: 'relative'
};

/**
 * Types of functions that can be used when crawling over a data tree node-by-node.
 *
 * @type {Object}
 */
base.APPLIERS = {
    AVERAGE: 'average',
    COMPLETION: 'completion'
};

/**
 * Types of exercises that the system is compatible with.
 *
 * @type {Object}
 */
base.EXERCISE_TYPES ={
    EXAMPREP: 'Exam Prep',
    PRACTICE: 'Practice'
}

/**
 * Types of functions that can be used to rank a set of questions for a given exercise-question pool
 *
 * @type {Object}
 */
base.PRIORITIZERS = {
    EXPOSURE: 'exposure',
    PERCENTAGE: 'percentage'
};

/**
 * Initialize the given data tree.
 *
 * @param {Object} config Parameters that tell the system what appliers, prioritizers, and
 *                      pullers to use.
 * @param {Object} data Arbritrary data that can be passed to applier and prioritizer functions for
 *                      use in calculations.
 */
base.init = function (config, data){
    mixin(base, EventEmitter.prototype);
    this.config = config;

    this.data = data || {};
    this.data.identifier = this.identifier;
};

/**
 * Puller that will take questions from the root node of the data tree ONLY.
 *
 * @param {Category} category Node to take questions from.
 * @param {Integer} total Number of questions to be retrieved.
 * @param {EXERCISE_TYPES} type Type of exercise is being generated?
 * @return {Array.<Question>} Questions retrieved from node.
 */
base.absolutePuller = function (category, total, type){
    var category = _.find(this.data.categories, {id: category});

    if (!category){
        throw new Error('Tree Puller - Failed to find category');
    }

    var takeAmount = category.questions.length < total ? total : category.questions.length;
    var questions = prioritizer(questions, {prioritizers: this.config.prioritizers});

    return _.shuffle(_.first(questions, takeAmount));
};

/**
 * Crawl a data tree from bottom to top, applying our config.appliers to each node.
 *
 * @param {Category} node Current node to evaluate.
 * 
 * @return {Category} Data tree that has new value to each leaf => node.data.stats
 */
base.crawler = function (node){
    // Crawl from bottom to top.
    if (node.children && node.children.length){
        node.children.map(function (child){
            return this.crawler(child);
        }, this);
    }

    node.data = node.data || {};

    // Take our config.appliers and interpret this node.
    node.data.stats = applier(node, this.data, {appliers: this.config.appliers});
    
    return node;
};

/**
 * Generate exercise questions for a given category and type.
 *
 * @param {Category} category Start point for the exercise questions (root)
 * @param {Number} total How many questions should be drawn total.
 * @param {EXERCISE_TYPES} type Is the exercise practice or exam?
 * @param {PULLER} pullerType How should the questions be drawn from the tree.
 * @return {Array.<Question>} Questions to insert into the exercise.
 */
base.exercise = function (category, total, type, pullerType){
    var pullerType = pullerType || this.config.puller;

    switch(pullerType){
        case this.PULLER.RELATIVE:
            return this.relativePuller(category, total, type);
            break;
        case this.PULLER.ABSOLUTE:
            return this.absolutePuller(category, total, type);
            break;
        default:
            throw new Error('Exercise - Hit invalid case.');
            break;
    }
};

/**
 * Take a category and parse into parent-child data tree.
 *
 * @param {Category} category Current category to determine children.
 * 
 * @return {Category} Parent-child data tree.
 */
base.parser = function (category){
    var children = _.where(this.data.categories, {parentId: category.id});

    // Recursively call from bottom to top of tree.
    if (children.length){
        children = children.map(function (item){
            return this.parser(item.values);
        }, this);
    } 
    category.children = children;

    return category;
};

/**
 * Take a category and run the parser to put into Parent-Child Format.
 *
 * @param {Integer} categoryId Category Id that should be considered the root.
 * @param {Object} options Options for the parser.
 * @param {Options.replaceRoot} replaceRoot Required to tell the function whether to replace the 
 *                                          content tree.
 * 
 * @return {Category} Data tree in the parent-child format.
 */
base.parseTree = function (categoryId, options){
    var root = _.find(this.data.categories, {id: categoryId}).values;
    if (!root){
        throw new Error('ParseTree - Category ID given not valid.');
    }

    root = this.parser(root);
    if (options.replaceRoot){
        this.content = root;
    }

    return root;
};

/**
 * In the case that an exercise needs to generate an exam that relies on an category as well as its
 * children. 
 *
 * @param {=Integer} category Database id for category to generate exercise.
 * @param {=Integer} total How many questions to generate for exercise. (Not Mandatory)
 * @param {EXERCISE_TYPES=EXAM_PREP} type What type of exercise is being generated.
 * 
 * @return {Array.<Question>} Questions to be presented for exercise.
 */
base.relativePuller = function (category, total, type){
    var difference = 0;
    var leftOvers = [];
    var questions = [];

    switch(type) {
        /**
         * The requested exercise has structure, there must be weighted totals of the first level.
         * The system parses down to level 1, gets the weights of each, then takes a weighted total 
         * based on the level 1 weight for how many questions to take.
         *
         */
        case this.EXERCISE_TYPES.EXAMPREP:
            // Exam prep doesn't pass in a category.
            var searchTerm = { identifier: this.identifier, parentId: null };
            category = category ? category : _.find(this.data.categories, searchTerm).id;

            // Find the root category of the tree.
            var tree = this.parseTree(category, {replaceRoot: false});

            // TODO(BRYCE) Decide if the root should have any questions.
            // Take all Level 1 categories and find take an amount of questions based off
            // category weight.
            questions = tree.children.map(function (child){
                // Make a list of all the children that fall below the Level 1 category.
                var questions = _(this.treeReducer(child))
                    .pluck('questions')
                    .flatten()
                    .value();

                // Run all the questions through the prioritizer.
                questions = prioritizer(questions, {prioritizers: this.config.prioritizers});

                // Determine how many questions the child category passed in is responsible for.
                var childTake = Math.round((child.weight / 100).toFixed(2) * total);
                
                // Make sure that we have enough questions, if not change our total and add to the 
                // sum difference of all Level 1.
                if (childTake > questions.length){
                    difference += (childTake - questions.length);
                    childTake = questions.length;
                } else {
                    // Add all leftOver questions in case another Level 1 cannot meet it's
                    // obligation for questions.
                    var leftOver = questions.length - childTake;
                    leftOvers = leftOvers.concat(_.last(questions, leftOver));
                }

                return _.first(questions, childTake);
            }, this);
    
            // Combine all Level 1 child questions together.
            questions = _.flatten(questions);
            break;
        /**
         * The requested exercise has no structure in the sense of weights. Retrieve a list of the
         * children that fall below the category passed in, and prioritize the questions for all
         * of the children combined, then take a number based on the total passed in or otherwise.
         *
         */
        case this.EXERCISE_TYPES.PRACTICE:
            // Parse the tree based on the category passed in.
            var tree = this.parseTree(category, {replaceRoot: false});

            // Reduce all child categories of category passed in to list.
            var questions = _(this.treeReducer(tree))
                .pluck('questions')
                .flatten()
                .value();

            // Prioritize all of questions for category passed in as well as children.
            questions = prioritizer(questions, {prioritizers: this.config.prioritizers});

            // Check to see if there are enough questions to fulfill total.
            total = total > questions.length ? questions.length : total;

            questions = _.take(questions, total);

            break;
        default:
            throw new Error('Relative Puller - Hit Invalid Case');
            break;
    }

    // Case for if we have some Left Over questions from a Level, and a difference due to a category
    // not being able to fulfill its obligation. 
    if (difference && leftOvers.length){
        var addAmount = difference > leftOvers.length ? leftOvers.length : difference;
        questions = questions.concat(_.first(leftOvers, addAmount));
    }

    _.forEach(questions, function(question){
        question.answer.values = _.shuffle(question.answer.values);
    });

    return _.shuffle(questions);
}

/**
 * Generate statistics for every node on the data tree, starting from root.
 *
 * @return {Category} Data tree with data.stats attached to each leaf.
 */
base.stats = function (){
    // Find the root category
    var root = _.find(this.data.categories, {parentId: null, identifier: this.identifier}).values;
    
    // Parse the tree
    var tree = this.parser(root);

    // Crawl each node on the tree and apply our config.appliers.
    return this.crawler(tree);
};

/**
 * Climb a given data tree and reduce every node from bottom to root into an Array.
 *
 * @param {Category} node Root node for the reducer to start from.
 * @param {Array} aggregate Array to push each node to.
 * @return {Array.<Category>} Array of all nodes from given bottom to given root.
 */
base.treeReducer = function (node, aggregate){
    // Inititialize if this is the Level 0
    if (aggregate === undefined){
        aggregate = [];
    }

    // Recursive call for all children.
    if (node.children && node.children.length){
        node.children.forEach(function (child){
            this.treeReducer(child, aggregate);
        }, this);
    }   

    // Add the category to our array.
    aggregate.push(node);
    return aggregate;
};
