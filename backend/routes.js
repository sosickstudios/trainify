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

    app.get('/api/util', function (req, res){
        // var Question = require('./models/question');
        // var Promise = require('bluebird');
        // var _ = require('lodash');
        // Question
        //     .findAll()
        //     .then(function (result){
        //         return Promise.all(_.map(result, function (item){
        //             var answerExplanation = _.find(item.answer.values, {isCorrect: true});
        //             return Question.update({explanation: answerExplanation.text}, {id: item.id});
        //         }));
        //     }).then(function (){
        //         res.send(200);
        //     }).catch(function (e){
        //         console.log(e);
        //     });
        console.log('here');
        var Promise = require('bluebird');
        var importer = require('./../import');
        importer.categories()
            .then(function (){
                res.send(200);
            });
    });
}

module.exports = registerRoutes;
