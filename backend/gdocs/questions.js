var _ = require('lodash');
var Category = require('./../models/category');
var CategoryQuestion = require('./../models/categoryquestions');
var config = require('config');
var he = require('he');
var Promise = require('bluebird');
var Question = require('./../models/question');
var Spreadsheet = require('edit-google-spreadsheet');
var Training = require('./../models/training');

/**
 * Maps the specified row using the keys to create an object that is more intuitive
 * to use. The spreadsheet object is in the format of {rowNumber: {columnIndex: columnValue}},
 * and the keys is a map of that mapping. So keys.0 would be ID, as ID is the first
 * column.
 *
 * @param {Object.<String, String>} keys The map of row indexes to column names.
 * @param {Object} row The question to map.
 *
 * @returns {MappedQuestion}
 */
function mapRowToQuestion(keys, row){

    var result = {};
    _.each(keys, function(entry, key){
        var val = row[entry]
        if (typeof val === 'string'){
            val = decodeString(val);
            val = val.replace('&', ' & ');
        }
        result[key] = val;
    });

    return result;
}

/**
 * Decodes the specified string, ensuring all instances of special characters get
 * properly decoded.
 *
 * @param {String} value The value to decode.
 *
 * @returns {String}
 */
function decodeString(value){
    if (!value) return undefined;

    return he.unescape(he.decode(value));
}

function purgeOldData(ids){
    return Question.findAll({where: {id: ids}, include: [Category]})
        .then(function (questions){
            var badQuestions = _.filter(questions, function (question){
                return !question.categories.length;
            });

            if(badQuestions.length){
              return Question.destroy({where: {id: badQuestions}});  
            }

            return;
            
        });
}

/**
 * Attempts to extract the answer from a mapped question in a google doc
 * spreadsheet into the JSON format we expect.
 *
 * @param {MappedQuestion} mappedQuestion The question to extract the answer from.
 */
function extractAnswer(mappedQuestion, keys){
    var answer = {
        type: mappedQuestion.type,
        values: []
    };

    if (answer.type === Question.TYPE.BOOLEAN){
        var valTrue = {id: 1, value: true, isCorrect: false};
        var valFalse = {id: 2, value: false, isCorrect: false};

        if (mappedQuestion['correct'] === 'YES'){
            valTrue.isCorrect = true;
        } else {
            valFalse.isCorrect = true;
        }

        answer.values.push(valTrue, valFalse);
    } else if (answer.type === Question.TYPE.MULTIPLE){
        answer.values.push({id: 1, text: mappedQuestion['correct'], isCorrect: true});

        if (mappedQuestion['incorrect b']) answer.values.push({id: 2, text: mappedQuestion['incorrect b'], isCorrect: false});
        if (mappedQuestion['incorrect c']) answer.values.push({id: 3, text: mappedQuestion['incorrect c'], isCorrect: false});
        if (mappedQuestion['incorrect d']) answer.values.push({id: 4, text: mappedQuestion['incorrect d'], isCorrect: false});
    }

    return answer;
}

function fixCategoryQuestionJoins(parentKeys, id, question){
    id = parseInt(id, 10);

    var promises = [];
    parentKeys.forEach(function (key){
        var parent = question[key];

        if(parent){
             var parentId = parseInt(parent.match(/(\()(\d*)(\))/)[2], 10);
             var joinFields = {
                categoryId: parentId, 
                questionId: id
            };
             promises.push(CategoryQuestion.findOrCreate(joinFields, joinFields));           
        }

    });

    var relevantJoins;
    return Promise.all(promises)
        .then(function (results){
            relevantJoins = results;

            return CategoryQuestion.findAll({where: {questionId: id}});
        })
        .then(function (results){
            // Purge all old attachments
            var irrelevantJoins = [];
            results.forEach(function (join){
                var foundRelevantJoin = _.find(relevantJoins, {id: join.id});

                if(!foundRelevantJoin){
                    irrelevantJoins.push(join.id);
                }
            });

            if(irrelevantJoins.length){
                CategoryQuestion.destroy({id: irrelevantJoins});
            } 

            return id; 
        })
        .catch(function (e){
            // console.log(e);
        });  
}
/**
 * Creates or updates the question specified to our database.
 *
 * @param {MappedQuestion} mappedQuestion The question to map or create.
 *
 * @returns {Promise}
 */
function createOrUpdateQuestion(mappedQuestion){
    var answerKeys = [
        'correct',
        'incorrect b',
        'incorrect c',
        'incorrect d'
    ];

    var parentKeys = [
        'chapter parent',
        'legend parent',
        'matrix parent'        
    ];
    var omitted = ['id'];  
    omitted = omitted.concat(answerKeys); 
    omitted = omitted.concat(parentKeys);

    var question = _.omit(mappedQuestion, omitted);
    
    // Get our new answer object.
    question.answer = extractAnswer(mappedQuestion, answerKeys);

    var promise;
    if (mappedQuestion.id){
        promise = Question.find(mappedQuestion.id)
            .then(function(result){
                return result.updateAttributes(question);
            });
    } else {
        promise = Question.create(question);
    }

    return promise
        .then(function (question){
            return fixCategoryQuestionJoins(parentKeys, question.id, mappedQuestion);
        })
        .catch(function (e){
            console.log(e);
        });
}

/**
 * Updates the questions of the specified training course from a source
 * Google Docs spreadsheet.
 *
 * @param {Integer} trainingId The ID of the training course to update.
 * @param {Spreadsheet} spreadsheet The spreadsheet for the categories to update.
 *
 * @returns {Promise}
 */
module.exports = function(trainingId, spreadsheet){
    return (new Promise(function(resolve, reject){

        // Get all of the rows now that the spreadsheets metadata has been loaded.
        spreadsheet.receive(function(err, rows) {
            // If we can't get the rows then there is no point in proceeding.
            if (err) return reject(rows);

            resolve(rows);
        });
    })).then(function (rows){
        var keys = {};
        // Get the header row
        var keysRow = rows['1'];

        // Create the keys in the map based on the values specified
        // in the header row of the spreadsheet. Creates structure like:
        //   keys = {
        //     id: 'ID',
        //     text: 'Text of the question',
        //     category: 'Some category'
        //   }
        _.each(keysRow, function(entry, key){
            keys[entry.toLowerCase()] = key;
        });

        var mappedQuestions = _(rows)
            .filter(function (row){
                return row[keys['id']] !== 'ID';
            })
            .map(_.bind(mapRowToQuestion, null, keys))
            .map(_.bind(createOrUpdateQuestion, null))
            .value();

        return Promise.all(mappedQuestions);
    })
    // .then(function (results){
    //     return purgeOldData(results);
    // })
    .catch(function (e){
        console.log(e);
    })
};