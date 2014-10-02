var _ = require('lodash');
var express = require('express');
var router = express.Router();
var stats = require('./stats');
var Category = require('./../models/category');
var Exercise = require('./../models/exercise');
var Question = require('./../models/question');
var Result = require('./../models/result');
var Training = require('./../models/training');

var dash = {
	/**
	 * Route intended to provide the dashboard for the user. This view shows an overview
	 * of the training courses that the user has purchased from the Trainify.io store. 
	 * This routes main purpose is to render the 'dash.hbs' handlebars view, with the 
	 * current Training and Provider injected into the view.
	 *
	 * @param {Express.request} req Express application request object.
	 * @param {Express.response} res Express application response object.
	 */
	get: function (req, res){
        var user = res.locals.user;

        var trainingPromise = Training.find({
            where: {name: req.params.id.replace(/-/g, ' ')},
            include: [Category]
        });

        trainingPromise.then(function(training){
            Exercise.findAll({
                where: {userId: user.id, trainingId: training.id},
                include: [{
                    model: Result,
                    include: [Question]
                }]
            }).then(function(exercises){
                var tree = stats.statTree(training, exercises);

                var childCategories = _(tree.category.children)
                        .pluck('children')
                        .flatten()
                        .value();

                var allCategories = tree.category.children.concat(childCategories);

                _.forEach(allCategories, function(category){
                    if (category.stats.hasCourses){
                        if (category.stats.leafAverage === -1){
                            category.stats.status = 'standard';
                        } else if (category.stats.leafAverage <= 50){
                            category.stats.status = 'failing';
                        } else if (category.stats.leafAverage <= 80){
                            category.stats.status = 'caution';
                        } else {
                            category.stats.status = 'passing';
                        }
                    }
                });

                res.render('dash', {
                    training: training,
                    stats: tree.stats,
                    categories: allCategories
                });
            });
        });
	}
};

// Express route '/api/dash'
router.route('/:id')
	.get(dash.get);

module.exports = router;