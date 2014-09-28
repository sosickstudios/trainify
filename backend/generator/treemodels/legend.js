var base = require('./base');
var mixin = require('utils-merge');

var legend = {
    identifier: 'legend'
};

/**
 * Data tree that is represented by legend.
 *
 * @param {Object} data Meta data pertaining to the data tree.
 * 
 * @return {Legend} Object representing legend data tree.
 */
function createLegendTree(data){
    // Configure the data tree.
    var config = {
        appliers: [base.APPLIERS.AVERAGE, base.APPLIERS.COMPLETION],
        prioritizers: [base.PRIORITIZERS.EXPOSURE, base.PRIORITIZERS.PERCENTAGE],
        puller: base.PULLER.ABSOLUTE
    };

    // Merge our base.js with this object.
    mixin(legend, base);

    // Call our inherited initialization.
    legend.init(config, data);

    return legend;
}

module.exports = exports = createLegendTree;