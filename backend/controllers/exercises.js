var _ = require('lodash');
var Category = require('./../models/category');
var Exercise = require('./../models/exercise');
var express = require('express');
var generator = require('./../generator');
var Promise = require('bluebird');
var Question = require('./../models/question');
var Result = require('./../models/result');
var router = express.Router();
var Training = require('./../models/training');
var utils = require('../utils');


var exercise = {
    /**
     * Route for generating an exercise.
     *
     * URL should be in the following format:
     * 
     * /exercise?category={category.id}&path={category.path}&trainingId={training.id}&type={[
     * Practice, Exam Prep]}
     *
     * @param {Express.request} req Express application request object.
     * @param {Express.response} res Express application response object.
     */
    
    get: function (req, res){
        // Query parameters
        var categoryId = parseInt(req.query.category, 10);
        var trainingId = parseInt(req.query.trainingId, 10);
        var total = parseInt(req.query.total, 10);
        var tree = req.query.tree;
        var type = req.query.type || 'Exam Prep';
        var user = res.locals.user;

        var promises = [
            Category.findAll({where: {trainingId: trainingId}, 
                include: [{model: Question, include: [Result]}]}),
            Exercise.create({userId: user.id, trainingId: trainingId, type: type}),
            Exercise.findAll({where: {userId: user.id, trainingId: trainingId}}),
            Training.find({where: {id: trainingId}})
        ];

        // Create our exercise, and find the training course that it belongs to.
        Promise.all(promises).then(function (result){
    
            // Our newly created exercise
            var exercise = result[1].values;
            var training = result[3].values;

            // Data for the trees.
            var data = { 
                categories: result[0], 
                exercises: result[2], 
                training: training 
            };

            // Use our system to generate new exercise questions.
            var questions = generator(data).exercise(tree, categoryId, total, type, null);

            // Render handlebars template.
            res.render('exercise', {
                dashlink: '/course/' + training.name.replace(/\s/g, '-'),
                exercise: exercise, 
                questions: questions,
                training: training,
                category: _.find(data.categories, {id: categoryId})
            });
        })
        .catch(utils.apiError);
    },
    put: {
        /**
         * Update an exercise by scoring and adding a completion date, returning the exercise when
         * completed.
         *
         * @param {Express.request} req Express application request object.
         * @param {Express.response} res Express application response object.
         */
        exercise: function (req, res){
            var exerciseId = req.body.id;

            Exercise.find({where: {id: exerciseId}, include: [Result]}).then(function(exercise){
                var correct = _.where(exercise.results, {result: true}).length;
                var score = Math.round((correct / exercise.results.length).toFixed(2) * 100);

                // Score the exercise, based on amount correct vs. incorrect.
                exercise.score = score;
                exercise.completed = new Date();

                return exercise.save();
            }).then(function (exercise){
                res.send(exercise);
            }).catch(utils.apiError);
        },
        /**
         * Update request for an exercise. This will take an object that is expected to be 
         * the Result model. 
         *
         * @param {Express.request} req Express application request object.
         * @param {Express.response} res Express application response object.
         */
        result: function (req, res){
            var questionId = req.params.id;
            var user = res.locals.user;

            // Find the question, make sure to load the answer associated with it.
            Question.find(questionId).then(function (question){
                var update = req.body;
                    
                // The answer the user selected.
                var chosen = _.find(question.answer.values, {id: parseInt(update.chosen, 10)});

                // Each correct answer if flagged by a isCorrect Boolean
                var result = chosen.isCorrect;
               
                // Should this be the second time of updating the result, it will hold an id.
                if(update.id) {
                    return Result.update({result: result, chosen: chosen.id}, {id: update.id}, {returning: true});
                } else {
                    update.result = result;
                    update.userId = user.id;
                    return question.createResult(update);
                }
            }).then(function (){
                res.send(200);
            })
            .catch(utils.apiError);
        }
    }
};

// Express route '/exercise'
router.route('/')
    .get(exercise.get)
    .put(exercise.put.exercise);

// Express route '/exercise/question/:id'
router.route('/question/:id')
    .put(exercise.put.result);

module.exports = router;
