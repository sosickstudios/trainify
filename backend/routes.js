/**
 * Responsibe for registering all of our routes and routers.
 *
 * @param  {Express.application} app The express application instance.
 */
function registerRoutes(app){
  app.get('/api/stats', require('./controllers/stats').treeGet);

  app.route('/dash')
  	.get(require('./controllers/dash').get);

  app.use('/', require('./controllers/home'));

  app.get('/api/util', function (req, res) {
  	// var Company  =require('./models/company');
  	// Company.create({
  	// 	name: 'Global Project Management LLC.',
  	// 	bio: 'Global Project Management, LLC was formed in 1996 to provide project management services to construction and power utilities companies in New Orleans and Baton Rouge. For more than 18 years, Global PM has evolved into an industry-leading project management software, training, and services firm.'
  	// });
  	// var Training = require('./models/training');
  	// Training.create({
  	// 	description: 'Project Management Training',
  	// 	name: 'Project Management Training',
  	// 	examTotal: 200
  	// });
  	
  	// var Access = require('./models/access');
  	// Access.findAll({include: [Training]})
  	// 	.then(function (training){
  	// 		console.log(training[0].trainings.length);
  	// 		res.send(200);
  	// 	});
  // 	var endDate = new Date();
  // 	endDate.setFullYear(2016);
 	// Access.create({
 	// 	end: endDate,
 	// 	trainingId: 1,
 	// 	userId: 1
 	// }).then(function (training){
 	// 	console.log(training);
 	// });
 	// 
 	// var Category = require('./models/category');

 	// Category.create({
 	// 	name: 'Category 5', 
 	// 	description: 'This is the category 5 description',
 	// 	parentId: 4
 	// });

 	res.send(200);
 	
  });
}

module.exports = registerRoutes;
