/**
 * trainify/backend/models/result.js
 */
'use strict';

var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

var Result = sequelize.define('result', {
	id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
	chosen: { type: Sequelize.INTEGER },
	number: { type: Sequelize.INTEGER },
	result: { type: Sequelize.BOOLEAN, defaultValue: null }
});

module.exports = Result;
