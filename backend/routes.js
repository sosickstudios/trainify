var app = global.app;
var controllers = global.controllers;

/**
 * Routes for trainify that don't qualify to fall under a controller.
 * @param  { Object }   req  express.js application request object.
 * @param  { Object }   res  express.js application response object.
 * @param  { Function } next express.js middleware callback.
 */
app.get('/', function(req, res, next){
  console.log('User is ', + req.user);
  res.render('index', {
    isDevelopment: process.env.NODE_ENV !== 'production'
  });
});

app.get('/api/ping', function(req, res){
  res.send('Date is ' + Date.now());
});

app.get('/api/util', function (req, res) {
	var Course = global.plugins.db.training;

	global.plugins.db.company.create({
		bio: 'Global Project Management, LLC was formed in 1996 to provide project management services to construction and power utilities companies in New Orleans and Baton Rouge. For more than 18 years, Global PM has evolved into an industry-leading project management software, training, and services firm.',
		name: 'Global Project Management LLC',
		city: 'Slidell',
		state: 'Louisiana',
		street: '1925 Corporate Square Drive, Suite B.',
		zip: '70458'
	}).success(function (company) {
		Course.create({
			companyId: company.id,
			name: 'Project Management Professional Training', 
			description: 'Training for the PMI PMP certification exam.',
			examTotal: 200
		}).success(function (course) {
			console.log(course);
		});		
	});

});