/**
 * Responsibe for registering all of our routes and routers.
 *
 * @param  {Express.application} app The express application instance.
 */
function registerRoutes(app){
  

  app.route('/dash')
  	.get(require('./controllers/dash').get);

  app.use('/', require('./controllers/home'));
  app.use('/api/stats', require('./controllers/stats'));
}

module.exports = registerRoutes;
