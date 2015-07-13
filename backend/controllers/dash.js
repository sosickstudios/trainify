/**
 * trainify/backend/controllers/dash.js
 */
'use strict';

var _ = require('lodash');
var express = require('express');
var router = express.Router();
var stats = require('./stats');
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
    * @returns {undefined} No payload data provided.
    */
    get: function GetDashboardData(req, res){
        var name = req.params.id.replace(/-/g, ' ');
        var user = res.locals.user;

        var query = {where: {name: name }};
        Training.find(query).then(function(training){
            stats.data(training, user).then(function(decoratedTraining){
                var generatedStats = decoratedTraining.stats;
                var legendTree = generatedStats.trees.legend;

                _.forEach(legendTree.children, function(category){
                    category.hasAverages = category.data.stats.average !== -1;

                    if (category.data.stats.average === -1){
                        category.data.stats.status = 'standard';
                    } else if (category.data.stats.average <= 50){
                        category.data.stats.status = 'failing';
                    } else if (category.data.stats.average <= 80){
                        category.data.stats.status = 'caution';
                    } else{
                        category.data.stats.status = 'passing';
                    }
                });

                res.send({
                    training: decoratedTraining,
                    stats: generatedStats,
                    categories: legendTree.children,
                    user: user
                });
            });
        });
    }
};

// Express route '/api/dash'
router.route('/:id')
	.get(dash.get);

module.exports = router;
