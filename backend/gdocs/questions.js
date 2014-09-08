var _ = require('lodash');
var Category = require('./../models/category');
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

/**
 * Syncronizes all question ids back to google docs.
 *
 * @param {Array.Object} questions The mapped rows of the spreadsheet.
 * @param {edit-google-spreadsheet.Spreadsheet} spreadsheet The spreadsheet object model.
 *
 * @returns {Promise}
 */
function syncronizeIdsToGdocs(questions, spreadsheet){
    return new Promise(function(resolve){
        // Spreadsheet.add expects an object in the form of
        // { rowNumber: { columnIndex: columnValue } }
        var update = {};

        // Loop through all of the mapped rows from google docs and
        // create an entry with the updated id.
        _.each(questions, function(question, index){
            update[(index + 2).toString()] = {1: question.id};
        });

        // We have to add our updated rows, even if we are just updating it.
        spreadsheet.add(update);

        // Add calls are batched, but we can go ahead and send the update now
        // since our object contains all of the updates already.
        spreadsheet.send(function() {
            // Integrate logs at some point.
        });

        resolve()
    });
}

/**
 * Attempts to extract the answer from a mapped question in a google doc
 * spreadsheet into the JSON format we expect.
 *
 * @param {MappedQuestion} mappedQuestion The question to extract the answer from.
 */
function extractAnswer(mappedQuestion){
    var answer = {
        type: mappedQuestion.type,
        values: []
    };

    if (answer.type === Question.TYPE.BOOLEAN){
        var valTrue = {id: 1, value: true, isCorrect: false};
        var valFalse = {id: 2, value: false, isCorrect: false};

        if (mappedQuestion.correctanswer === 'YES'){
            valTrue.isCorrect = true;
        } else {
            valFalse.isCorrect = true;
        }

        answer.values.push(valTrue, valFalse);
    } else if (answer.type === Question.TYPE.MULTIPLE){
        answer.values.push({id: 1, text: mappedQuestion.correctanswer, isCorrect: true});

        if (mappedQuestion.answerb) answer.values.push({id: 2, text: mappedQuestion.answerb, isCorrect: false});
        if (mappedQuestion.answerc) answer.values.push({id: 3, text: mappedQuestion.answerc, isCorrect: false});
        if (mappedQuestion.answerd) answer.values.push({id: 4, text: mappedQuestion.answerd, isCorrect: false});
    }

    mappedQuestion.answer = answer;
}

/**
 * Creates or updates the question specified to our database.
 *
 * @param {MappedQuestion} mappedQuestion The question to map or create.
 *
 * @returns {Promise}
 */
function createOrUpdateQuestion(mappedQuestion){
    return new Promise(function(resolve){
        mappedQuestion.type = Question.TYPE[mappedQuestion.type.toUpperCase()];

        Category.find({where: {name: mappedQuestion.category}}).then(function(category){
            mappedQuestion.path = category.path + category.id + ',';
            mappedQuestion.categoryId = category.id;

            extractAnswer(mappedQuestion);

            if (!mappedQuestion.id){
                return Question.create(mappedQuestion).then(function(newQuestion){
                    resolve(newQuestion);
                });
            }

            Question.find(mappedQuestion.id).then(function(dbQuestion){
                dbQuestion.updateAttributes(mappedQuestion).success(function(question){
                    resolve(question);
                });
            });
        });
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
    return new Promise(function(resolve, reject){
        // Get all of the rows now that the spreadsheets metadata has been loaded.
        spreadsheet.receive(function(err, rows) {
            // If we can't get the rows then there is no point in proceeding.
            if (err) return reject(rows);

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
                keys[entry.toLowerCase().replace(' ', '')] = key;
            });

            // Ensure we filter out the key row first.
            var mappedQuestions = _.filter(rows, function(row){
                return row[keys['id']] !== 'ID';
            });


            // Map each entry to an easier to use object matching the extracted
            // keys.
            mappedQuestions = _.map(mappedQuestions, _.bind(mapRowToQuestion, null, keys));

            Promise.all(_.map(mappedQuestions, createOrUpdateQuestion))
                    .then(function(questions){
                        syncronizeIdsToGdocs(questions, spreadsheet).then(resolve);
                    });
        });

    });
};