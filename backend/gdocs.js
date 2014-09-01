var Spreadsheet = require('edit-google-spreadsheet');
var config = require('config');
var Promise = require('bluebird');
var _ = require('lodash');
var Category = require('./models/category');

function mapRow(keys, row){
    var result = {};
    _.each(keys, function(entry, key){
       result[key] = row[entry];
    });
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
                            if (!category) return;

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