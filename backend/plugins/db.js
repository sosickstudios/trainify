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

// Associations for models to allow includes
models.answer.belongsTo(models.question, { as: 'content' });

models.category.hasOne(models.category, { as: 'parent', foreignKey: 'parentId'});

models.company.hasMany(models.training);
models.company.hasMany(models.user, { as: 'administrator', foreignKey: 'adminId'});

models.exercise.hasMany(models.answer);

models.question.hasOne(models.training);

models.training.hasMany(models.access);
models.training.hasMany(models.exercise);
models.training.hasOne(models.category);

models.user.hasMany(models.access);
models.user.hasMany(models.exercise, { as: 'exercises' });

Object.keys(models).forEach(function(modelName) {
  if ('associate' in models[modelName]) {
    db[modelName].associate(db);
  }
});
