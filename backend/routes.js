/**
 * Responsibe for registering all of our routes and routers.
 *
 * @param  {Express.application} app The express application instance.
 */
function registerRoutes(app){
	app.use('/', require('./controllers/home'));
	app.use('/dash', require('./controllers/dash'));
    app.use('/exercise', require('./controllers/exercises'));
	app.use('/api/stats', require('./controllers/stats'));

    // app.get('/api/util', function (){
    //     var Question = require('./models/question');
    //     Question.create({
    //         text: 'This is the 3rd question text',
    //         path: ',1,4,6,'
    //     }).then(function (question){
    //         question.createAnswer({correct: 'This is the correct answer', incorrect: ['This is one incorrect answer', 'This is another incorrect answer']});
    //     });
    // });
}

module.exports = registerRoutes;
