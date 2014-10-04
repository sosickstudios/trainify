var _ = require('lodash');
var Category = require('./../models/category');
var config = require('config');
var he = require('he');
var Promise = require('bluebird');
var Spreadsheet = require('edit-google-spreadsheet');
var Training = require('./../models/training');
var gdocs = require('./index');

/**
 * Maps the specified row using the keys to create an object that is more intuitive
 * to use. The spreadsheet object is in the format of {rowNumber: {columnIndex: columnValue}},
 * and the keys is a map of that mapping. So keys.0 would be ID, as ID is the first
 * column.
 *
 * @param {Object.<String, String>} keys The map of row indexes to column names.
 * @param {Object} row The category to add or update.
 *
 * @returns {MappedCategory}
 */
function mapRowToCategory(keys, row){
    var result = {};
    _.each(keys, function(entry, key){
        result[key] = row[entry];
    });
    result.name = decodeString(result.name);
    result.name = result.name.replace('&', ' & ');
    
    result.parentId = decodeString(result.parentId);
    if (result.parentId){
        result.parentId = result.parentId.replace('&', ' & ');

        // Extract the id from the parent string that's in format (id) name
        var index = result.parentId.search(/\)/);
        var id = result.parentId.slice(1, index);
        result.parentId = parseInt(id, 10);
    }

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
 * Builds all categories by either creating new ones or updating existing ones.
 *
 * @param {Array.<MappedCategory>} mappedCategories All of the categories, not just the current level.
 * @param {Integer} trainingId The id of the training course we are updating.
 *
 * @returns {Promise}
 */
function buildAllCategories(mappedCategories, trainingId){
    // Ensure each category gets the correct parent training course.
    _.each(mappedCategories, function(category){
        category.trainingId = trainingId;
    });

    return Promise.map(mappedCategories, function (category){
        // If the row has an ID that's a number then it already exists, so just
        // update its attributes to ensure it is syncronized.
        if (_.isNumber(category.id)){
            return Category.find(category.id)
                .then(function (result){
                    return result.updateAttributes(category);
                });
        }

        // Once we create the category go ahead and update the id of the
        // mapped row from gdocs to make syncronizing easier later.
        return Category.create(category).then(function(newCategory){
            category.id = newCategory.id;
            return newCategory;
        });
    })
    .catch(function (e){
        console.log(e);
    });
}

function synchronizeGDocs (mapped, allCategories, keys, spreadsheet) {
    keys = _.omit(keys, 'parentId');

    // Keys parent
    var update = {};
    _.each(mapped, function (row, key, index){
        var local = {};
        var category = _.find(allCategories, {id: row.id});

        if(!category){
            category = _.find(allCategories, {name: row[keys.name], identifier: row[keys.identifier]});
        }

        if(!category){
            throw new Error('Failed to find proper category');
        }

        var parent;
        if(category.parentId) {
            parent = _.find(allCategories, {id: category.parentId});

            local['3'] = '(' + parent.id + ') ' + parent.name; 
        }

        _.forEach(keys, function (item, index){
            local[item] = category[index];
        });

        local['6'] = '(' + category.id + ') ' + category.name;
        update[(parseInt(key, 10) + 2).toString()] = local;
    });

    return new Promise(function (resolve, reject){
        spreadsheet.add(update);

        spreadsheet.send(function (err){
            if(err) return reject(err);
            
            resolve();
        });
    });
}

/**
 * Updates the categories of the specified training course from a source
 * Google Docs spreadsheet.
 *
 * @param {Integer} trainingId The ID of the training course to update.
 * @param {Spreadsheet} spreadsheet The spreadsheet for the categories to update.
 *
 * @returns {Promise}
 */
module.exports = function(trainingId, spreadsheet){
    var promises = [
        (new Promise(function (resolve, reject){
            spreadsheet.receive(function(err, rows){
                if(err) reject(err);

                resolve(rows);
            });
        })),
        Category.findAll({where: {trainingId: trainingId}})
    ];

    var mappedCategories;
    var currentCategories;
    var rows;
    var keys = {};
    return Promise.all(promises)
        .then(function (results){
            rows = results[0];
            var categories = results[1];

            // Get the header row
            var keysRow = rows['1'];

            // Create the keys in the map based on the values specified
            // in the header row of the spreadsheet. Creates structure like:
            //   keys = {
            //     id: '1',
            //     name: '2',
            //     parent: '3',
            //     weight: '4',
            //     identifier: '5',
            //     (id) name: '6'
            //   }
            _.each(keysRow, function(entry, key){
                keys[decodeString(entry.toLowerCase())] = key;
            });
            // Remove the unnecessary combination column
            // HACK(BRYCE)
            delete keys['(id) name']
            delete keys['parent'];
            keys['parentId'] = '3';

            mappedCategories = _(rows)
                .filter(function (row){
                    // Filter out the header row;
                    return row[keys['id']] !== 'ID';
                })
                .map(_.bind(mapRowToCategory, null, keys))
                .value();

            return buildAllCategories(mappedCategories, trainingId);
        })
        .then(function (categories){
            currentCategories = categories;
            return Promise.all([
                synchronizeGDocs(mappedCategories, categories, keys, spreadsheet),
                Category.findAll({trainingId: trainingId})
            ]);
        })
        .then(function (results){
            // Purge categories that are no longer relevant;
            var mappedList = _.pluck(currentCategories, 'id');
            var masterList = _.pluck(results[1], 'id');

            if (masterList.length > mappedList.length){
                var needsPurging = _.difference(masterList, mappedList);
                return Category.destroy({id: needsPurging});  
            }
            
            return;
        })
        .catch(function (e){
            // One catch net for all calls.
            console.log(e);
        });
};