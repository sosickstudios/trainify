/**
 * trainify/backend/models/categoryquestions.js
 */
'use strict';

var sequelize = require('../plugins/db');

/**
 * Model showing the hasMany to hasMany relationship between Categories and Questions. Added for the
 * ability to query the Join table without instantiating the DAO instance first.
 *
 * @type {Sequelize}
 */
module.exports = sequelize.define('categoryquestions', {
});
