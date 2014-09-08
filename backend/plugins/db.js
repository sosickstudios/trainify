var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var _         = require('lodash');
var path      = require('path');
var config    = require('config').db;

var sequelize = new Sequelize(config.name, config.user, config.password, {
  dialect:  'postgres',
  protocol: 'postgres',
  port:     config.port,
  host:     config.host,
  logging:  false,
  pool:     { maxConnections: 5, maxIdleTime: 30 }
});

module.exports = sequelize;

var models = require('require-dir')('../models');

// Give the parent-child structure to the category through association.
models.category
    .hasMany(models.category, { as: 'children', foreignKey: 'parentId'});

models.company
    .hasMany(models.training)
    .hasMany(models.user, { as: 'administrator', foreignKey: 'adminId'});

models.exercise
    .belongsTo(models.user)
    .hasMany(models.result);

models.question
    .hasMany(models.result)
    .belongsTo(models.category);

models.result
    .belongsTo(models.exercise)
    .belongsTo(models.question);

models.training
    .belongsTo(models.company)
    .hasMany(models.access)
    .hasMany(models.exercise)
    .hasMany(models.category);

models.user
    .hasMany(models.access, {as: 'access'})
    .hasMany(models.exercise, { as: 'exercises' });

// sequelize.sync();

Object.keys(models).forEach(function(modelName) {
  if ('associate' in models[modelName]) {
    db[modelName].associate(db);
  }
});
