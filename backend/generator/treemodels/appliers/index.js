/**
 * Run stats on a given node from a data tree.
 *
 * @param {Category} node Current node to run calculations on.
 * @param {=Object} data ArbitraryData sent in for use in applier calculations.
 * @param {Object} options Options to configure which appliers to use.
 * 
 * @return {Object} Data resulting from calculations on the node.
 */
function createApplier (node, data, options){
    var stats = {};

    // Apply our given appliers set in config to the node.
    options.appliers.forEach(function (applier){
        var applierPath = './' + applier;
        stats[applier] = require(applierPath)(node, data);
    });

    return stats;
}

module.exports = exports = createApplier;