/**
 * trainify/backend/generator/treemodels/matrix.js
 */
'use strict';

var base = require('./base');
var mixin = require('utils-merge');

var matrix = {
    identifier: 'matrix'
};

/**
 * Data tree that is represented as a matrix.
 *
 * @param {Object} data Meta data pertaining to the data tree.
 * @returns {Matrix} Object representing matrix data tree.
 */
function createMatrixTree(data){
    // Configure the data tree.
    var config = {
        appliers: [base.APPLIERS.AVERAGE],
        prioritizers: [base.PRIORITIZERS.EXPOSURE, base.PRIORITIZERS.PERCENTAGE],
        puller: base.PULLER.RELATIVE
    };

    // Merge our base.js with this object.
    mixin(matrix, base);

    // Call our inherited initialization.
    matrix.init(config, data);

    return matrix;
}

module.exports = exports = createMatrixTree;
