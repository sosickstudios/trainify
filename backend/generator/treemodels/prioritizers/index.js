/**
 * trainify/backend/generator/treemodels/prioritizers/index.js
 */
'use strict';

var _ = require('lodash');

/**
 * Prioritize a set of questions tossed in by calculating with our prioritizers.
 *
 * @param {Array.<Question>} questions Array of questions to sort.
 * @param {Object} options Options to configure which prioritizers to use.
 * @returns {Array.<Question>} Array of questions that have been sorted by prioritizers.
 */
function Prioritizer(questions, options){
    var data = {};

    // Load our given prioritizers that were specified in options.
    var fns = _.map(options.prioritizers, function (type){
        var path = './' + type;
        return require(path);
    });

    // What question has been answered the most amount of times.
    var highestExposureCount = _.max(questions, function (question){
            return question.results.length;
        });
    data.highestExposureCount = highestExposureCount.results.length;

    // Map, then sort our questions.
    questions = _(questions)
        .map(function (question){
            question = question.get();

            // Calculate total from our loaded prioritizers.
            var receivedTotal = fns.reduce(function (sum, fn){
                return sum + fn(question, data);
            }, 0);

            return {
                weight: receivedTotal,
                question: question
            };
        })
        .sortBy(function (item){
            // Sort lowest to highest.
            return -item.weight;
        })
        .pluck('question')
        .value();

    return questions;
}

module.exports = exports = Prioritizer;
