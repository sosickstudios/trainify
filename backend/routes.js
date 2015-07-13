/**
 * trainify/backend/routes.js
 */
'use strict';

/**
 * Responsibe for registering all of our routes and routers.
 *
 * @param  {Express.application} app The express application instance.
 * @returns {undefined} No payload data provided.
 */
function registerRoutes(app){
    app.use('/', require('./controllers/home'));
    app.use('/api/course', require('./controllers/dash'));
    app.use('/api/exercise', require('./controllers/exercises'));
    app.use('/api/users', require('./controllers/user'));
    app.use('/api/stats', require('./controllers/stats'));
}

module.exports = registerRoutes;
