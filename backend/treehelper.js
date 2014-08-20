var _ = require('lodash');

/** 
 * Tree helper for parsing categories into a parent-child format, as well as apply 
 * utility functions to the result. 
 *
 * @param {String} path A string containing the root that is desired for the tree.
 * @param {Array.<Category>} cats An array of categories for parsing our data tree.
 * @param {Object} meta Data that can be used by the apply function, in an effort to avoid 
 *                      copying data on a per-leaf basis.
 */
function Tree (path, cats, meta){
    this.categories = cats;
    this.path = path;
    this.root = _.find(this.categories, { path: path }).values;
    this.meta = meta;

    this.parseTree(this.root);
}

/**
 * Function to take the root category and parse it into the parent-child structure.
 *
 * @param {Category} category The category that we want to find children for.
 */
Tree.prototype.parseTree = function(category) {
    // Find all categories that are children of the category passed in.
    var cats = _.where(this.categories, {path: category.path + category.id + ','}, this);

    // If we have children for the category, recursively call this function upon each
    // category.
    if(cats.length){
        cats =_.map(cats, function(item){
            // Drop our DAO instance to reduce memory useage as well as make the object 
            // configurable. 
            item = item.values;

            // Parse the child to find its children.
            this.parseTree(item);

            return item;
        }, this);
    }

    // Set our children.
    category.children = cats;
    
    return;
};

/**
 * Getter for retrieving the parent-child format tree.
 *
 * @return {Category}
 */
Tree.prototype.get = function(){
    return this.root;
};

/**
 * Run a set of functions on the tree, attaching an object of information to each
 * leaf on what the functions produced.
 *
 * @param {Array.<Object.<String, Function>>} fns Array of functions that will run over each leaf.
 * @param {Object} meta Data that can be accessed from each function being applied 
 *                              to the tree leaf.
 * @return {Category}
 */
Tree.prototype.treeApply = function(fns, meta){

    if (meta){
        // Make the meta data available to the prototype, so it doesn't have to copy each time.
        this.meta = meta;
    }

    // All the functions to be applied.
    this.fns = fns;

    // Apply to the root of the tree.
    this.leafApply(this.root);
};

Tree.prototype.treeTransform = function (fns, meta){
    if(meta){
        this.meta = meta;
    }

    this.fns = fns;

    return this.leafTransform(this.root);
}

/**
 * Apply the class functions on a leaf that is passed in, which is in the parent-child
 * format. Should work a data from the bottom-to-top, applying all functions in the fns
 * property along the way.
 *
 * @param {Category} leaf Category that is on a data tree.
 * 
 * @return {Category}
 */
Tree.prototype.leafApply = function(leaf){
    // Work the tree from the bottom up, so that we may have the children for a parent
    // occur before the parent itself.
    
    // Call all children recursively.
    if (leaf.children && leaf.children.length){ 
        leaf.children = _.map(leaf.children, function (item){
            return this.leafApply(item);
        }, this);
    }

    leaf.stats = {};
    _.each(this.fns, function (item){
        leaf.stats[item.key] = item.fn(leaf, this.meta);
    }, this);

    return leaf;    
};

/**
 * Each leaf needs the current category, parentTotal, questions, and children, answers
 *
 * @param {[type]} leaf [description]
 * @return {[type]}
 */
Tree.prototype.leafTransform = function(leaf){
    var leaf = leaf;

    var children;
    if (leaf.children && leaf.children.length){
        children = _.map(leaf.children, function (item){
            return this.leafTransform(item);
        }, this);
    }

    // Run the chain
    _.each(this.fns, function(item){
        var fn = item.fn.bind(this);
        leaf = fn(leaf, children);
    }, this);

    return leaf;
};

module.exports = Tree;