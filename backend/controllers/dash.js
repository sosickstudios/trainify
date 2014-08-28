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
	 */
	get: function (req, res){
		res.render('dash');
	}
};

// Express route '/api/dash'
router.route('/')
	.get(dash.get);

module.exports = router;