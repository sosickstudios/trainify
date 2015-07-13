/**
 * trainify/backend/models/company.js
 */
'use strict';

var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

module.exports = sequelize.define('company', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  bio: { type: Sequelize.TEXT },

  // Location Fields
  city: { type: Sequelize.STRING },
  province: { type: Sequelize.STRING },
  state: { type: Sequelize.STRING },
  street: { type: Sequelize.STRING },
  zip: { type: Sequelize.STRING },

  logo: { type: Sequelize.STRING },
  name: { type: Sequelize.STRING }
});
