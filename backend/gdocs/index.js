var _ = require('lodash');
var config = require('config');
var Promise = require('bluebird');
var Spreadsheet = require('edit-google-spreadsheet');
var Training = require('./../models/training');

/**
 * Gets the spreadsheet for the specified training course.
 *
 * @param {Integer} trainingId The ID of the training course to get the spreadsheet for.
 *
 * @returns {Promise.<Spreadsheet>}
 */
module.exports.spreadsheet = function(trainingId, worksheetName){
    worksheetName = worksheetName || 'Categories';

    return Training.find(trainingId)
        .then(function (training){
            return (new Promise(function (resolve, reject){
                Spreadsheet.load({
                    debug:         true,
                    spreadsheetName: training.id + ': ' + training.name,
                    worksheetName: worksheetName,

                    username: config.google.email,
                    password: config.google.password,

                }, function sheetReady(err, spreadsheet){
                    if (err) return reject(err);
                    resolve(spreadsheet);
                });
            }));
        })
        .catch(function (e){
            console.log(e);
        });
};

module.exports.questions = function(trainingId){
    return module.exports.spreadsheet(trainingId, 'Questions')
        .then(function(spreadsheet){
            var categoryGdocs = require('./questions');
            
            return categoryGdocs(trainingId, spreadsheet);
        })
        .catch(function (e){
            console.log(e);
        })
};

/**
 * Updates all of the categories from the google docs spreadsheet into our database.
 *
 * @param {Integer} trainingId The ID of the training course to get the spreadsheet for.
 *
 * @returns {Promise}
 */
module.exports.categories = function(trainingId){
    return module.exports.spreadsheet(trainingId)
        .then(function (){
            var categoryGdocs = require('./categories');

            return categoryGdocs(trainingId, spreadsheet);
        }).catch(function (e){
            console.log(e);
        });
};

/**
 * Updates the entire training course based on the settings specified in
 * the Google Docs spreadsheet corresponding to this training course.
 *
 * @param {Integer} trainingId The ID of the training course to get the spreadsheet for.
 *
 * @returns {Promise}
 */
module.exports.updateAll = function(trainingId){
    return module.exports.categories(trainingId)
        .then(function (){
            return module.exports.questions(trainingId);
        })
        .catch(function (e){
            console.log(e);
        });
};

var Category = require('./../models/category');
var Question = require('./../models/question');
module.exports.reload = function (trainingId){
    var cats;
    var sheet;
    return module.exports.spreadsheet(trainingId, 'Categories')
        .then(function (spreadsheet){
            sheet = spreadsheet;

            return Category.findAll({where: {trainingId: trainingId}, include: [Question, {model: Category, as: 'parent'}]});
        })
        .then(function (categories){
            cats = categories;
            categories = categories.map(function (category){
                var parent = null;
                if(category.parent) {
                    parent = '(' + category.parent.id + ') ' + category.parent.name;
                }
                
                return [category.id, category.name, parent, category.weight, category.identifier, '(' + category.id + ') ' + category.name];
            });
            categories.unshift(['ID', 'NAME', 'PARENT', 'WEIGHT', 'IDENTIFIER', '(ID) NAME']);
            sheet.add(categories);
            return sheet.send(function (e){
                console.log(e);
                return;
            });
        })
        .then(function (){
            return module.exports.spreadsheet(trainingId, 'Questions');
        })
        .then(function (spreadsheet){
            sheet = spreadsheet;
            cats = cats.map(function (category){
                return category.values;
            });
            console.log(cats);
            var questions = _(cats)
                .pluck('questions')
                .flatten()
                .pluck('id')
                .uniq()
                .value();

            return Question.findAll({where: {id: questions}, include: [Category]});
        })
        .then(function (questions){
            questions = questions.map(function (question){
                var result = [
                    question.id,
                    question.type, 
                    question.text, 
                    question.explanation
                ];

                if (question.type === Question.TYPE.MULTIPLE){
                    var correct = _.find(question.answer.values, {isCorrect: true});
                    
                    var incorrect = _.where(question.answer.values, {isCorrect: false});
                    incorrect = _.pluck(incorrect, 'text');

                    result.push(correct.text);
                    result = result.concat(incorrect);
                } else if(question.type === Question.TYPE.BOOLEAN){
                    var correct = _.find(question.answer.values, {isCorrect: true}).text;
                    var incorrect = _.find(question.answer.values, {isCorrect: false}).text;
                    result.push(correct);
                    result.push(incorrect);
                    result.push('DO NOT MODIFY');
                }

                var chapter = _.find(question.categories, {identifier: 'chapter'}) || '';
                var legend = _.find(question.categories, {identifier: 'legend'}) || '';
                var matrix = _.find(question.categories, {identifier: 'matrix'}) || '';
                
                result.push('(' + chapter.id + ') ' + chapter.name);
                result.push('(' + legend.id + ') ' + legend.name);
                result.push('(' + matrix.id + ') ' + matrix.name);
                
                return result;
            });
            var header = [
                'ID', 
                'TYPE',
                'TEXT', 
                'EXPLANATION', 
                'CORRECT', 
                'INCORRECT B', 
                'INCORRECT C', 
                'INCORRECT D',
                'CHAPTER PARENT',
                'LEGEND PARENT',
                'MATRIX PARENT'
            ];
            questions.unshift(header);
            sheet.add(questions);
            sheet.send(function (e){
                console.log(e);
                return;
            });
        })
        .catch(function (e){
            console.log(e);
        });
};