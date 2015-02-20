/**
 * trainify/backend/generator/treemodels/prioritizers/percentage.js
 */
'use strict';

var _ = require('lodash');

/**
 * Determine a weight for a question based on the percentage correctness.
 *
 * @param {Question} question Question to determine percentage for.
 * @returns {Number} Weight based on calculations made.
 */
function Percentage(question){
    var priorityWeight = 5;
    var questionAnswers = question.results;

    var correct = _.where(questionAnswers, {result: true}).length;
    var exposureCount = questionAnswers.length;
    /**
    *  Tiering system
    *
    *  Our scale will increase by means of 5 points for each area we wish to add in.
    *  Exposure will be responsible for 5 points, percentage another 5 points, etc
    *
    *  Percentage Granularity Expression: granularity = 5 / 100 = 0.05
    *  Each percentage point will be responsible for a 0.05 addition to the scale.
    *  Percentage Properties: {
    *     100 >= percentage >= 90: Lowest Priority ~ 0.00 - 0.5
    *     89 >= percentage >= 80: Higher Priority ~ 0.55 - 1.05
    *     79 >= percentage >= 70:
    *     69 >= percentage >= 60:
    *     59 >= percentage >= 50:
    *     49 >= percentage >= 40:
    *     39 >= percentage >= 30:
    *     29 >= percentage >= 20:
    *     19 >= percentage >= 10:
    *     9 >= percentage >= 0: Highest Priority ~ 4.55 - 5
    *
    *     // Absolute Value
    *     |expression| = Math.abs(expression)
    *     Equation: percentagePriorityWeight =
    *         | (decimalPercentage * 100) - 100 | * percentageGranularity
    *  }
    */

    if (exposureCount){
        var percentageGranularity = 0.05;
        var decimalPercentage = (correct / exposureCount).toFixed(2);

        priorityWeight = (Math.abs(Math.round(decimalPercentage * 100) - 100) * percentageGranularity);
    }

    return priorityWeight;
}

module.exports = exports = Percentage;
