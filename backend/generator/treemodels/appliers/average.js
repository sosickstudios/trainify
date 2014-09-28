var _ = require('lodash');

/**
 * Determine average of specific node in data tree.
 *
 * @param {Category} node Category in tree to run calculations on.
 *
 * @return {Number} Average of current node.
 */
function Average (node){
    var NO_RESULTS = -1;
    var results = _(node.questions)
        .pluck('results')
        .flatten()
        .value();

    var answeredCorrect = results.reduce(function (sum, answer){
        return answer.result ? ++sum : sum;
    }, 0);
    var answeredTotal = results.length;

    // Calculate the average of the correct/total then multiply the decimal by 100
    // for a whole number.
    var avg = Math.round((answeredCorrect / answeredTotal).toFixed(2) * 100);
    avg = avg || NO_RESULTS;

    var childrensAverage = 0;
    var selfPercentage = 1.0;
    // Get the average of our leaves.
    if (node.children.length){
        // Filter our categories that have 0 scores.
        var scoredCategories = _.filter(node.children, function (item){
            return item.data.stats.average > 0;
        });

        // Get the sum of all of our children who have scores.
        var averageSums = _.reduce(scoredCategories, function (sum, item){
            return sum + item.data.stats.average;
        }, 0);

        // Get the average of those said children.
        childrensAverage = Math.round(averageSums / (scoredCategories.length * 100) * 100);

        // Childrens scores will weight for 50%, have the current leafs total average as
        // .5 * selfAverage + .5 * childrensAverage
        selfPercentage - 0.5;
    }

    if (avg > NO_RESULTS){
        avg = Math.round(avg * selfPercentage) + Math.round(childrensAverage * 0.5);
    } else if (avg < 0 && childrensAverage > 0){
        // Current category has no average, take 50% of childrens average as its own.
        avg = Math.round(childrensAverage * .5);
    }

    return avg;    
}

module.exports = exports = Average;