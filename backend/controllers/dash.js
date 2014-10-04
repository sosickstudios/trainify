var _ = require('lodash');
var express = require('express');
var router = express.Router();
var stats = require('./stats');
var Category = require('./../models/category');
var Question = require('./../models/question');
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
            stats.data(training, res.locals.user).then(function(decoratedTraining){
                var generatedStats = decoratedTraining.stats;
                var legendTree = generatedStats.trees.legend;

                _.forEach(legendTree.children, function(category){
                    if (category.data.stats.average === -1){
                        category.data.stats.status = 'standard';
                    } else if (category.data.stats.average <= 50){
                        category.data.stats.status = 'failing';
                    } else if (category.data.stats.average <= 80){
                        category.data.stats.status = 'caution';
                    } else {
                        category.data.stats.status = 'passing';
                    }
                });

                res.render('dash', {
                    training: decoratedTraining,
                    stats: generatedStats.general,
                    categories: legendTree.children
                });
            });
        });
	}
};

// Express route '/api/dash'
router.route('/:id')
	.get(dash.get);

module.exports = router;