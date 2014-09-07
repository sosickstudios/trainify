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
    result.name = he.unescape(he.decode(result.name));
    result.name = result.name.replace('&', ' & ');
    return result;
}

/**
 * Either creates or updates the specified category.
 *
 * @param {MappedCategory} item The category to update or create.
 * @param {Array.<Category>} existingCategories All of the current categories in our object model.
 * @param {Integer} trainingId The id of the training course we are updating.
 *
 * @returns {Promise}
 */
function createOrUpdateCategory(item, existingCategories, trainingId){
    return new Promise(function(resolve){
        var category = _.findWhere(existingCategories, {id: item.id});

        // If the category doesn't exist, we need to create it.
        if (!category){
            var newValues = {
                trainingId: trainingId
            };

            // We need to find the parent and then figure out the path to use.
            if (item.parent){
                var parentCategory = _.findWhere(existingCategories, {name: item.parent});
                item.parentId = parentCategory.id;
            }

            return Category.create(_.extend(item, newValues)).then(function(newCategory){
                resolve(newCategory);
            });
        };

        Category.find(category.id).then(function(dbCategory){
            dbCategory.updateAttributes(item).success(function(){
                resolve(item);
            });
        });
    });
}

/**
 * Processes all of the categories sequentially, ensuring the categories
 * are all either created or updated from the google doc spreadsheet.
 *
 * @param {Category} root The root category of the course.
 * @param {Array.<MappedCategory>} mappedCategories All of the categories, not just the current level.
 * @param {Array.<Category>} existingCategories All of the current categories in our object model.
 * @param {Integer} trainingId The id of the training course we are updating.
 *
 * @returns {Promise}
 */
function buildAllCategories(root, mappedCategories, existingCategories, trainingId){
    return new Promise(function(resolve){
        // Find all categories with the parent set to the root
        var rootChildren = _.filter(mappedCategories, {parent: root.name});

        Promise.all(_.map(rootChildren, function(rootChild){
            return createOrUpdateCategory(rootChild, existingCategories, trainingId);
        })).then(function(newRootCategories){
            var allCategories = existingCategories.concat(newRootCategories);

            buildCategories(newRootCategories, allCategories, mappedCategories, trainingId)
                    .then(resolve);
        });
    });
}

/**
 * Recursively process the specified categories mapped from google docs rows,
 * ensuring that each current level is processed before starting the next level.
 * This allows us to recursively create a tree of categories.
 *
 * @param {Array.<MappedCategory>} categories The mapped categories to process.
 * @param {Array.<Category>} allCategories All of the current categories in our object model.
 * @param {Array.<MappedCategory>} mappedCategories All of the categories, not just the current level.
 * @param {Integer} trainingId The id of the training course we are updating.
 *
 * @returns {Promise}
 */
function buildCategories(categories, allCategories, mappedCategories, trainingId){
    return new Promise(function(resolve){
        Promise.all(_.map(categories, function(newCategory){
            var newCategoryChildren = _.filter(mappedCategories, {parent: newCategory.name});
            return Promise.all(_.map(newCategoryChildren, function(categoryChild){
                return createOrUpdateCategory(categoryChild, allCategories, trainingId);
            })).then(function(newCategories){
                return buildCategories(newCategories, allCategories.concat(newCategories), mappedCategories, trainingId);
            });
        })).then(resolve);
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
        Category.findAll({where: {trainingId: trainingId}})
                .then(function(allCategories){
                    // Spreadsheet.add expects an object in the form of
                    // { rowNumber: { columnIndex: columnValue } }
                    var update = {};

                    // Loop through all of the mapped rows from google docs and
                    // create an entry with the updated id.
                    _.each(gdocsMappedRows, function(mappedCategoryRow, index){
                        var category = _.findWhere(allCategories, {name: mappedCategoryRow.name});
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
 *
 * @returns {Promise}
 */
module.exports = function(trainingId){
    return new Promise(function(resolve, reject){
        // Since the spreadsheet name is based on the ID and name of the course we need
        // to get the course before we can get the corresponding spreadsheet.
        Training.find(trainingId).then(function(training){
            // Loads the metadata and creates an object model to interact with
            // the corresponding docs spreadsheet. We expect that the name of
            // the course will always correspond to the spreadsheet name and ID.
            Spreadsheet.load({
                debug: false,
                spreadsheetName: training.id + ': ' + training.name,
                worksheetName: 'Categories',

                username: config.google.email,
                password: config.google.password,

            }, function sheetReady(err, spreadsheet) {
                // If we can't get the spreadsheet then fail fast.
                if (err) return reject(err);

                // Get all of the rows now that the spreadsheets metadata has been loaded.
                spreadsheet.receive(function(err, rows) {
                    // If we can't get the rows then there is no point in proceeding.
                    if (err) return reject(rows);

                    // Get all of the categories to make updating easier.
                    Category.findAll({where: {trainingId: trainingId}})
                            .then(function(categories){
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

                                // Our sole root category should have an undefined parent property,
                                // even the key row will have an otherwise defined value.
                                var rootCategory = _.find(mappedCategories, function(category){
                                    return category.parent === undefined;
                                });

                                // We've now created the root category, so now we need to build the tree
                                // of categories to create up, and walk the tree level by level creating
                                // the child categories. We also need to ensure the prior level completes
                                // before you perform the next level.
                                createOrUpdateCategory(rootCategory, categories, trainingId).then(function(category){
                                    buildAllCategories(category, mappedCategories, categories.concat([category]), trainingId)
                                            .then(function(){
                                                syncronizeIdsToGdocs(mappedCategories, spreadsheet, trainingId)
                                                        .then(resolve);
                                            });
                                });
                            });
                });

            });
        });
    });
};