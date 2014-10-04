/**
 * Responsibe for registering all of our routes and routers.
 *
 * @param  {Express.application} app The express application instance.
 */
function registerRoutes(app){
    app.use('/', require('./controllers/home'));
    app.use('/course', require('./controllers/dash'));
    app.use('/exercise', require('./controllers/exercises'));
    app.use('/api/stats', require('./controllers/stats'));
}

module.exports = registerRoutes;
