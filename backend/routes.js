/**
 * Responsibe for registering all of our routes and routers.
 *
 * @param  {Express.application} app The express application instance.
 */
function registerRoutes(app){
  app.use('/', require('./controllers/home'));
}

module.exports = registerRoutes;