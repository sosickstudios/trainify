var _ = require('lodash');
var Promise = require('bluebird');
var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');



/**
 * Returns a function that can be called recursively for recusively eager loading
 * nested associations using sequelizes set up getters. This method will return a tree of data,
 * that has a children field attached if there are any existent.
 *
 * @param {Category}   item The object that has relations to load.
 */
function treeParser(item){
    return new Promise(function(resolve, reject){
        item.getChildren().then(function (result){
            if (result.length){
                Promise.all(_.map(result, function (child) {
                    return treeParser(child);
                })).then(function (children){
                    // Set the values of the children downstream to our object.
                    item.dataValues.children = children;
                    resolve(item);
                });
            } else {
                resolve(item);
            }
        });
    });
};

module.exports = sequelize.define('category', {
	id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
	description:  { type: Sequelize.TEXT },
	logo:         { type: Sequelize.STRING },
	name:         { type: Sequelize.STRING },
	path:         { type: Sequelize.STRING },
	weight:       { type: Sequelize.INTEGER }
}, {
    instanceMethods: {
        treeLoader: function (){
            return treeParser(this);
        }
    }
});

