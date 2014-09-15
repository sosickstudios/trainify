var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

module.exports = sequelize.define('access', {
    id: 	{ type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    end: 	{ type: Sequelize.DATE, defaultValue: null },
    start: 	{ type: Sequelize.DATE, defaultValue: Sequelize.NOW	},
    isAdmin:{ type: Sequelize.BOOLEAN, defaultValue: false }
});
