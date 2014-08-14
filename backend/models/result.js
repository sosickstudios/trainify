var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

module.exports = sequelize.define('result', {
	id:     { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
	chosen: { type: Sequelize.INTEGER },
	number: { type: Sequelize.INTEGER },
	result: { type: Sequelize.BOOLEAN, defaultValue: null }
});
