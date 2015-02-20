/**
 * trainify/backend/models/user.js
 */
'use strict';

var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

var User = sequelize.define('user', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    email: { type: Sequelize.STRING },
    isAdmin: { type: Sequelize.BOOLEAN, defaultValue: false },
    isMasterAdmin: { type: Sequelize.BOOLEAN, defaultValue: false },
    isUnsubscribed: { type: Sequelize.BOOLEAN, defaultValue: false}
});
module.exports = User;
