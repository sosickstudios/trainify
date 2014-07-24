var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var _         = require('lodash');
var path      = require('path');
var config    = require('config').db;

var db        = {};

var sequelize = new Sequelize(config.name, config.user, config.password, {
  dialect:  'postgres',
  protocol: 'postgres',
  port:     config.port,
  host:     config.host,
  logging:  false,
  pool:     { maxConnections: 5, maxIdleTime: 30 }
});

var modelsPath = path.normalize(__dirname + '/../models');

fs
  .readdirSync(modelsPath)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(modelsPath, file))
    db[model.name] = model
  });

// Associations for models to allow includes
db.answer.belongsTo(db.question, { as: 'content' });

db.category.hasOne(db.category, { as: 'parent', foreignKey: 'parentId'});

db.company.hasMany(db.training);
db.company.hasMany(db.user, { as: 'administrator', foreignKey: 'adminId'});

db.exercise.hasMany(db.answer);

db.question.hasOne(db.training);

db.training.hasMany(db.access);
db.training.hasMany(db.exercise);
db.training.hasOne(db.category);

db.user.hasMany(db.access);
db.user.hasMany(db.exercise, { as: 'exercises' });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

module.exports = global.db = _.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db);
