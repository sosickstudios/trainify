var Promise = require('bluebird');

var accessId = 1;
var companyId = 2;
var trainingId = 1;
var userId = 1;

module.exports.all = function(){
    return new Promise(function(resolve){
        module.exports.company().then(function(){
            module.exports.training().then(function(){
                    module.exports.categories().then(function (){
                        module.exports.user().then(function (){
                            module.exports.access().then(resolve);
                        });
                });
            });
        });
    });
};

module.exports.access = function (){
    require('./../backend/plugins/db');
    var Access = require('./../backend/models/access');

    return new Promise(function (resolve){
        Access.create({
            userId: userId,
            trainingId: trainingId,
            end: (new Date(2015, 11, 11))
        }).then(function (access){
            accessId = access.id;
            resolve(access);
        });
    });
};

module.exports.categories = function(){
    //process.env.NODE_ENV = 'remote';
    return new Promise(function(resolve){
        require('./../backend/plugins/db');
        var Category = require('./../backend/models/category');
        var Question = require('./../backend/models/question');
        var CategoryQuestion = require('./../backend/models/categoryquestions');
        var categories = require('./categories');
        var questions = require('./questions');
        var _ = require('lodash');
        var Promise = require('bluebird');
        var idMap = {};

        questions = _.filter(questions, function(question){
            return question.path;
        });

        Promise.all(_.map(categories, function (item){

            return Category.create({
                identifier: Category.TYPES.MATRIX,
                trainingId: trainingId,
                name: item.name,
                weight: item.weight,
                path: item.path
            });
        })).then(function (items){
            _.each(items, function (item){
                var search = {
                    name: item.name
                };

                if(item.path){
                    search.path = item.path;
                }

                var id = _.find(categories, search)._id.$oid;
                idMap[id] = item.id;
            });

            return Promise.all(_.map(items, function (item){
                var path = [];
                if(item.path){
                    var temp = item.path.split(',');

                    _.each(temp, function (id){
                        if(id){
                            var newId = idMap[id];
                            path.push(newId);
                        }
                    });
                }

                if(path && path.length){
                    var parentId = path[path.length - 1];
                    item.parentId = parentId;
                }

                item.path = path.join(',');
                if(item.path){
                    item.path = ',' + item.path + ',';
                } else {
                    item.path = ',';
                }

                return Category.update({path: item.path, parentId: item.parentId}, { where: {id: item.id}});
            }));
        }).then(function (saves){
            return Question.bulkCreate(_.map(questions, function (item){
                var idCount = 1;
                var answer = {
                    type: item.type,
                    values: []
                };

                if (item.type === 'multiple'){
                    answer.values.push({id: idCount, text: item.answer.correct.text, explanation: item.explanation, isCorrect: true});

                    _.each(item.answer.incorrect, function (incorrect){
                        idCount++;
                        answer.values.push({id: idCount, text: incorrect.text, explanation: incorrect.explanation, isCorrect: false});
                    });
                } else{
                    //TRUE/FALSE
                    var trueAnswer = {id: 1, text: 'True', explanation: null, isCorrect: false};
                    var falseAnswer = {id: 2, text: 'False', explanation: null, isCorrect: false};

                    if(item.answer.bool){
                        trueAnswer.isCorrect = true;
                        trueAnswer.explanation = item.explanation;
                    } else {
                        falseAnswer.isCorrect = true;
                        falseAnswer.explanation = item.explanation;
                    }
                    answer.values.push(trueAnswer);
                    answer.values.push(falseAnswer);
                }

                var path = [];
                if(item.path){
                    var temp = item.path.split(',');

                    _.each(temp, function (id){
                        if(id){
                            var newId = idMap[id];
                            path.push(newId);
                        }
                    });
                }

                item.path = path.join(',');
                item.path = ',' + item.path + ',';

                return {
                    explanation: String(item.explanation),
                    path: item.path,
                    text: item.text,
                    type: item.type,
                    answer: answer
                }
            })).then(function(){
                var promises = [
                    Category.findAll(),
                    Question.findAll()
                ];

                return Promise.all(promises);
            }).then(function (results){
                var joins = [];
                _.each(results[0], function (item){
                    var questions = _.where(results[1], {path: item.path + item.id + ','});
                    if(questions.length){
                        _.each(questions, function (question){
                            joins.push(CategoryQuestion.create({questionId: question.id, categoryId: item.id}));
                        });
                    }
                });

                return Promise.all(joins);
            }).then(function (){
                resolve();
            })
        });
    });
};

module.exports.company = function(){
    require('./../backend/plugins/db');
    return new Promise(function(resolve){
        var Company = require('./../backend/models/company');
        Company.findOrCreate({ where: {
            name: 'Trainify',
            bio: 'Trainify Description'
        }}).then(function(company){
            companyId = company.id;
            resolve();
        });
    });
};

module.exports.training = function(){
    require('./../backend/plugins/db');
    var Training = require('./../backend/models/training');
    return new Promise(function(resolve){
        Training.findOrCreate({ where: {
            name: 'Test Course',
            description: 'Test Description',
            companyId: companyId, 
            practiceExamTotal: 5,
            structuredExamTotal: 50,
            cost: 20
        }}).then(function(course){
            trainingId = course.id;
            resolve(course);
        });
    });
};

module.exports.user = function (){
    require('./../backend/plugins/db');
    var User = require('./../backend/models/user');

    return new Promise(function (resolve){
        User.create({
            name: 'Test User', 
            email: 'testuser@trainify.io',
        }).then(function (user){
            userId = user.id;
            resolve(user.values);
        });
    });
};

