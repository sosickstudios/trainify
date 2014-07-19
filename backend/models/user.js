var Sequelize = require('sequelize');

var User = global.db.sequelize.define('user', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  email: Sequelize.STRING,
  name: Sequelize.STRING,
  isAdmin: { type: Sequelize.BOOLEAN, defaultValue: false },
  isMasterAdmin: { type: Sequelize.BOOLEAN, defaultValue: false }
});

module.exports = User;
