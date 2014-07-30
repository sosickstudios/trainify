var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

module.exports = sequelize.define('category', {
	id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
	description:  { type: Sequelize.TEXT },
	logo:         { type: Sequelize.STRING },
	name:         { type: Sequelize.STRING },
	path:         { type: Sequelize.STRING },
	weight:       { type: Sequelize.INTEGER }
});

