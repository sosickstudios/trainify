var _ = require('lodash');
var Category = require('./../models/category');
var config = require('config');
var he = require('he');
var Promise = require('bluebird');
var Spreadsheet = require('edit-google-spreadsheet');
var Training = require('./../models/training');

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
    result.parent = decodeString(result.parent);
    if (result.parent){
        result.parent = result.parent.replace('&', ' & ');
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
    return new Promise(function(resolve){
        // Ensure each category gets the correct parent training course.
        _.each(mappedCategories, function(category){
            category.trainingId = trainingId;
        });

        return Promise.map(mappedCategories, function(category){
            // If the row has an ID that's a number then it already exists, so just
            // update its attributes to ensure it is syncronized.
            if (_.isNumber(category.id)){
                return Category.find(category.id).then(function(dbCategory){
                    return dbCategory.updateAttributes(category);
                });
            }

            // Once we create the category go ahead and update the id of the
            // mapped row from gdocs to make syncronizing easier later.
            return Category.create(category).then(function(newCategory){
                category.id = newCategory.id;
                return newCategory;
            });
        }).then(resolve);
    });
}

/**
 * Corrects the parent structure of categories.
 *
 * @param {Array.<Category>} categories The categories to fix.
 * @param {Integer} trainingId The id of the training course we are updating.
 *
 * @returns {Promise}
 */
function fixParentStructure(categories, trainingId){
    return Promise.map(categories, function(category){
        return Category.find({where: {
            trainingId: trainingId,
            name: category.selectedValues.parent
        }}).then(function(parent){
            // The root category, doesn't need to update.
            if (!parent) return category;

            category.parentId = parent.id;
            category.updateAttributes({parentId: parent.id});

            return category;
        });
    }).then(function(updatedCategories){
        // Now that we've fixed the parent structures we can go ahead
        // and update the paths.
        return calculateCategoryPaths(updatedCategories);
    });
}

/**
 * Ensures that all of the specified categories have the correct path based on their
 * parentId relationship.
 *
 * @param {Array.<Category>} categories The categories that should have their paths updated.
 *
 * @returns {Promise}
 */
function calculateCategoryPaths(categories){
    return new Promise(function(resolve){
        // Since we are coming from the DB, we should look for null as the root category.
        var root = _.find(categories, {parentId: null});
        root.path = ',';

        // Update the path of the root category.
        root.updateAttributes({path: root.path}).success(function(){
            // Update all direct children of the root category.
            processCategoryPath(_.filter(categories, {parentId: root.id}), root, categories)
                    .then(resolve);
        });
    });
}

/**
 * Updates the path of the specified categories, and then recursively
 * updates all of the direct children of the specified categories.
 *
 * @param {Array.<Category>} categories The categories to update.
 * @param {Category} parent The parent of the specified categories.
 * @param {Array.<Category>} allCategories All of the categories, not just the current level.
 *
 * @returns {Promise}
 */
function processCategoryPath(categories, parent, allCategories){
    return Promise.all(_.map(categories, function(category){
        category.path = parent.path + parent.id + ',';
        category.updateAttributes({path: category.path});

        return processCategoryPath(_.filter(allCategories, {parentId: category.id}), category, allCategories);
    }));
}

/**
 * Syncronizes all category ids back to google docs.
 *
 * @param {Array.Object} gdocsMappedRows The mapped rows of the spreadsheet.
 * @param {edit-google-spreadsheet.Spreadsheet} spreadsheet The spreadsheet object model.
 * @param {Integer} trainingId The id of the training course we are updating.
 *
 * @returns {Promise}
 */
function syncronizeIdsToGdocs(gdocsMappedRows, spreadsheet, trainingId){
    return new Promise(function(resolve){
        // Everything has been updated, now let's update the gdoc
        // with the latest IDs.
        Category.findAll({where: {trainingId: trainingId}, include: [{model: Category, as: 'parent'}]})
                .then(function(allCategories){
                    // Spreadsheet.add expects an object in the form of
                    // { rowNumber: { columnIndex: columnValue } }
                    var update = {};

                    // Loop through all of the mapped rows from google docs and
                    // create an entry with the updated id.
                    _.each(gdocsMappedRows, function(mappedCategoryRow, index){
                        var category = _.findWhere(allCategories, {id: mappedCategoryRow.id});

                        // If we can't get the category by ID, then fall back to the name. This
                        // happens the first time a category is created.
                        if (!category){
                            category = _.findWhere(allCategories, function(category){
                                // We need to match up the parent as well in the case of categories
                                // that have the same name.
                                if (mappedCategoryRow.parent){
                                    return category.parent &&
                                            category.parent.name === mappedCategoryRow.parent &&
                                            category.name === mappedCategoryRow.name;
                                }

                                return category.name === mappedCategoryRow.name;
                            });
                        }

                        update[(index + 2).toString()] = {1: category.id};
                    });

                    // We have to add our updated rows, even if we are just updating it.
                    spreadsheet.add(update);

                    // Add calls are batched, but we can go ahead and send the update now
                    // since our object contains all of the updates already.
                    spreadsheet.send(function() {
                        // Integrate logs at some point.
                    });

                    // Ensure we update the paths of the categories to be accurate
                    // after we do any updates.
                    calculateCategoryPaths(allCategories).then(resolve);
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
    return new Promise(function(resolve, reject){
        // Get all of the rows now that the spreadsheets metadata has been loaded.
        spreadsheet.receive(function(err, rows) {
            // If we can't get the rows then there is no point in proceeding.
            if (err) return reject(rows);

            // Get all of the categories to make updating easier.
            Category.findAll({where: {trainingId: trainingId}})
                    .then(function(categories){
                        var allCreatedChildren = [];
                        var keys = {};
                        // Get the header row
                        var keysRow = rows['1'];

                        // Create the keys in the map based on the values specified
                        // in the header row of the spreadsheet. Creates structure like:
                        //   keys = {
                        //     id: 'ID',
                        //     name: 'Name',
                        //     parent: 'Parent Category'
                        //   }
                        _.each(keysRow, function(entry, key){
                            keys[entry.toLowerCase().replace(' ', '')] = key;
                        });

                        // Ensure we filter out the key row first.
                        var mappedCategories = _.filter(rows, function(row){
                            return row[keys['id']] !== 'ID';
                        });


                        // Map each entry to an easier to use object matching the extracted
                        // keys.
                        mappedCategories = _.map(mappedCategories, _.bind(mapRowToCategory, null, keys));

                        // We build all of our categories out first, then fix their parent structure
                        // after that.
                        buildAllCategories(mappedCategories, trainingId)
                                .then(function(items){
                                    fixParentStructure(items, trainingId).then(function(){
                                        syncronizeIdsToGdocs(mappedCategories, spreadsheet, trainingId)
                                                .then(resolve);
                                    });
                                });
                    });
        });

    });
};