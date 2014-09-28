var _ = require('lodash');

/**
 * Determine the percentage of questions that the user has answered for a given node.
 *
 * @param {Category} node Current node to run calculations on.
 *
 * @return {Object.<Integer, Integer, Integer} Object containing ran statistics.
 */
function Completion (node){
    var total = node.questions.length;

    // Find count of questions that havent been answered.
    var remaining = node.questions.reduce(function (sum, question){
        if(!question.results.length){
            return sum++;
        }
    }, 0);

    // Add on children stats with parents.
    if (node.children && node.children.length){
        node.children.forEach(function (child){
            // TODO(BRYCE) weight children percentage with parent.
            remaining += child.data.remaining;
            runningTotal += child.data.total;
        });
    } 

    var percentage = Math.round((remaining/total).toFixed(2) * 100);
    return = {
        remaining: remaining,
        percentage: percentage,
        total: total
    };
}

module.exports = exports = Completion;