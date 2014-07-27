var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

module.exports = sequelize.define('user', {
  id:             { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  email:          { type: Sequelize.STRING },
  isAdmin:        { type: Sequelize.BOOLEAN, defaultValue: false },
  isMasterAdmin:  { type: Sequelize.BOOLEAN, defaultValue: false },
  isUnsubscribed: { type: Sequelize.BOOLEAN, defaultValue: false}
});
