var Spreadsheet = require('edit-google-spreadsheet');
var config = require('config');
var Promise = require('bluebird');
var _ = require('lodash');
var Category = require('./models/category');
var he = require('he');

function mapRow(keys, row){
    var result = {};
    _.each(keys, function(entry, key){
       result[key] = row[entry];
    });
    result.name = he.unescape(he.decode(result.name));
    result.name = result.name.replace('&', ' & ');
    return result;
}

module.exports = function(trainingId){
    return new Promise(function(resolve, reject){
        Spreadsheet.load({
            debug: false,
            spreadsheetId: '16_gIYX35VtW00HGmuQ5NTpn1U2U_1vgiXgrPBIai3KI',
            worksheetName: 'Categories',

            username: config.google.email,
            password: config.google.password,

        }, function sheetReady(err, spreadsheet) {

            if (err) {
                throw err;
            }

            spreadsheet.receive(function(err, rows, info) {
                if (err) {
                    reject(rows);
                }

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
                        //     parentCategory: 'Parent Category'
                        //   }
                        _.each(keysRow, function(entry, key){
                            keys[entry.toLowerCase().replace(' ', '')] = key;
                        });

                        _.each(rows, function(row){
                            var item = mapRow(keys, row);
                            var category = _.findWhere(categories, {id: item.id});

                            // Ignore the keys row as it has no real values.
                            if (row === keysRow) return;

                            // If the category doesn't exist, we need to create it.
                            if (!category){
                                var newValues = {
                                    trainingId: trainingId
                                };

                                // We need to find the parent and then figure out the path to use.
                                if (item.parent){
                                    var parentCategory = _.findWhere(categories, {name: item.parent});

                                    // If we have no ID, that means that the parent has yet to be
                                    // created. We need to wait on it to be created.
                                    if (!parentCategory.id){

                                    }
                                    item.parentId = parentCategory.id;
                                    console.log('Parent is %s', parentCategory.id);
                                }

                                Category.create(_.extend(item, newValues)).then(function(newCategory){
                                    console.log('Created %s', newCategory.id);
                                });

                                return;
                            };

                            Category.find(category.id).then(function(dbCategory){
                                dbCategory.updateAttributes(item).success(function(){
                                    console.log('Updated %s', item.name);
                                });
                            })
                        });

                        //console.dir(keys);
                    });
            });

        });
    });
};