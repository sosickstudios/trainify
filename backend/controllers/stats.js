var _ = require('lodash');
var Category = require('./../models/category');
var Exercise = require('./../models/exercise');
var generator = require('./../generator');
var express = require('express');
var Promise = require('bluebird');
var Question = require('./../models/question');
var Result = require('./../models/result');
var router = express.Router();
var Training = require('./../models/training');
var utils = require('./../utils');

/**
 * Calculate the data that will be displayed on the top of the dash.
 *
 * @param {Array.<Exercise>} exercises The exercises for the given training course.
 * 
 * @return {Object}
 */
function examStats (exercises){
    var result = {};

    // Find all exercises that have been completed.
    var all = _.where(exercises, function (exercise){
        return exercise.completed !== null;
    });

    // Find all exercises that have been completed and failed.
    result.failCount = _.where(all, function (exercise){
        return exercise.score <= 65;
    }).length;

    // Find all exercises that have been completed and passed.
    result.passCount = _.where(all, function (exercise){
        return exercise.score > 65;
    }).length;
    
    // Calculate the average of all exams that have been completed.
    var totalEarnedPoints = _.reduce(all, function (sum, exercise){
        return sum + exercise.score;
    }, 0);

    // Get the exam average by doing totalEarnedPoints / totalPossiblePoints
    result.examAverage = Math.round((totalEarnedPoints / (all.length * 100)).toFixed(2) * 100);

    return result;
}

/**
 * Contains the routes that have custom handling logic.
 * @type {Object}
 */
var stats = {
    get:{
        data: function(training, user){
            return new Promise(function(resolve){
                if (!user){
                    return training;
                }

                var promises = [
                    Category.findAll({where: {trainingId: training.id},
                        include: [{model: Question, include: [Result]}]}),
                    Exercise.findAll({where: {userId: user.id, trainingId: training.id}})
                ];

                Promise.all(promises).then(function (result){
                    /**
                     * Results is the resolves promises above, broken apart from eager loading to
                     * optimize the time of the query.
                     *
                     * results[0]: Categories for all trainings the user has access to.
                     * results[1]: Exercises for all trainings the user has access to.
                     */
                    var exercises = result[1];

                    // Data for the trees.
                    var data = {
                        categories: result[0],
                        exercises: exercises,
                        training: training
                    };

                    training.stats = {
                        trees: generator(data).stats(),
                        general: examStats(exercises)
                    };

                    //Send the data as a script, to be executed on the DOM.
                    resolve(training);
                });
            })
        },

        /**
         * Api call intended to provide a summary of data for a training course,
         * returning a tree of data based on the categories for that training course.
         * Each leaf in the tree will have an object called 'stats' that will contain
         * calculated averages and statistics based off the current users' past
         * exercises.
         *
         * @param {Express.request} req Express application request object.
         * @param {Express.response} res Express application response object.
         */
        tree: function (req, res){
            var user = res.locals.user;
            
            if (!user){
                return res.send(200, '');
            }

            var trainingId = 1;
            var promises = [
                Category.findAll({where: {trainingId: trainingId},
                    include: [{model: Question, include: [Result]}]}),
                Exercise.findAll({where: {userId: user.id, trainingId: trainingId}}),
            	Training.find({where: {id: trainingId}})
            ];

            Promise.all(promises).then(function (result){
            	/**
            	 * Results is the resolves promises above, broken apart from eager loading to
            	 * optimize the time of the query.
            	 *
            	 * results[0]: Categories for all trainings the user has access to.
            	 * results[1]: Exercises for all trainings the user has access to.
            	 * results[2]: Training courses the user has access to.
            	 */
                var exercises = result[1];
                var training = result[2].values;

                // Data for the trees.
                var data = {
                    categories: result[0],
                    exercises: exercises,
                    training: training
                };

                training.stats = {
                    trees: generator(data).stats(),
                    general: examStats(exercises)
                };

                //Send the data as a script, to be executed on the DOM.
                res.send('window.Trainify.initCourseData(' + JSON.stringify([training]) + ')');
            }).catch(utils.apiError);
        }
    }
};

// Express route '/api/stats/tree'
router.route('/tree')
    .get(stats.get.tree);

module.exports = router;
module.exports.tree = stats.get.tree;
module.exports.data = stats.get.data;