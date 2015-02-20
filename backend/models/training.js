/**
 * trainify/backend/models/training.js
 */
'use strict';

var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

var Training = sequelize.define('training', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    description: { type: Sequelize.TEXT },
    legal: { type: Sequelize.TEXT},
    logo: { type: Sequelize.STRING },
    name: { type: Sequelize.TEXT },
    practiceExamTotal: { type: Sequelize.INTEGER },
    structuredExamTotal: { type: Sequelize.INTEGER },
    cost: { type: Sequelize.INTEGER }
});

module.exports = Training;
