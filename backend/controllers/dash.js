var _ = require('lodash');
var app = global.app;
var Training = require('./../models/training');

var mockTraining = {
	name: 'Project Management Professional',
	description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
	category: {
		name: 'ROOT Category', 
		children: [{
			name: 'Child 1',
			children: [{
				name: 'Child2'
			}]
		}, {
			name: 'Child 3'
		}]
	},  
	company: {
		name: 'Global Project Management LLC.', 
		bio: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.'
	}
};

var Sequelize = require('sequelize');
var Access = require('./../models/access');
var Company = require('./../models/company');
var Exercise = require('./../models/exercise');

var dash = {
	get: function (req, res, next){
		var query = req.query.trainingId; 
		var user = res.locals.user;

		if(!query || !user){
			res.render('error');
			return;
		}

		Training.find(query)
			.then(function (training) {
				Company.find(training.companyId)
					.then(function (company){
						res.render('dash', {
							company: company,
							training: training
						});
					});
			});
	}
};

module.exports = dash;



