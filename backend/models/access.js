/**
 * trainify/backend/models/access.js
 */
'use strict';

var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

var Access = sequelize.define('access', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    end: { type: Sequelize.DATE, defaultValue: null },
    start: { type: Sequelize.DATE, defaultValue: Sequelize.NOW	},
    isAdmin: { type: Sequelize.BOOLEAN, defaultValue: false }
});

module.exports = Access;
