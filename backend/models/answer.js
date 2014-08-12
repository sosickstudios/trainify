var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

module.exports = sequelize.define('answer', {
    id:         { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    bool:       { type: Sequelize.BOOLEAN },
    correct:    { type: Sequelize.TEXT },
    incorrect:  { type: Sequelize.ARRAY( Sequelize.TEXT) }
});