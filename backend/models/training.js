var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

module.exports = sequelize.define('training', {
	id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
	description:  { type: Sequelize.TEXT },
	examTotal:    { type: Sequelize.INTEGER },
	logo:         { type: Sequelize.STRING },
	name: 		  { type: Sequelize.TEXT}
});