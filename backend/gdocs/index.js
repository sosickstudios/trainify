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

    return new Promise(function(resolve, reject){
        // Since the spreadsheet name is based on the ID and name of the course we need
        // to get the course before we can get the corresponding spreadsheet.
        Training.find(trainingId).then(function (training){
            Spreadsheet.load({
                debug:         false,
                spreadsheetName: training.id + ': ' + training.name,
                worksheetName: worksheetName,

                username: config.google.email,
                password: config.google.password,

            }, function sheetReady(err, spreadsheet){
                if (err) return reject(err);
                resolve(spreadsheet);
            });
        });
    });
};

/**
 * Updates all of the categories from the google docs spreadsheet into our database.
 *
 * @param {Integer} trainingId The ID of the training course to get the spreadsheet for.
 *
 * @returns {Promise}
 */
module.exports.categories = function(trainingId){
    return new Promise(function(resolve){
        module.exports.spreadsheet(trainingId).then(function(spreadsheet){
            var categoryGdocs = require('./categories');
            categoryGdocs(trainingId, spreadsheet).then(resolve);
        });
    });
};