/**
 * trainify/backend/models/category.js
 */
'use strict';

var _ = require('lodash');
var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

var TYPES = {
    CHAPTER: 'chapter',
    LEGEND: 'legend',
    MATRIX: 'matrix'
};

var Category = sequelize.define('category', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    identifier: { type: Sequelize.ENUM, values: _.values(TYPES) },
    logo: { type: Sequelize.STRING },
    name: { type: Sequelize.STRING },
    path: { type: Sequelize.STRING },
    weight: { type: Sequelize.INTEGER }
});
Category.TYPES = TYPES;

module.exports = Category;
