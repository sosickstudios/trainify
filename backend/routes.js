/**
 * Responsibe for registering all of our routes and routers.
 *
 * @param  {Express.application} app The express application instance.
 */
function registerRoutes(app){
	app.use('/', require('./controllers/home'));
	app.use('/dash', require('./controllers/dash'));
	app.use('/api/stats', require('./controllers/stats'));
}

module.exports = registerRoutes;
