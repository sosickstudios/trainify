var fs        = require('fs')
  , path      = require('path')
  , Sequelize = require('sequelize')
  , lodash    = require('lodash')
  , path      = require('path')
  , db        = {};

var sequelize = new Sequelize('sosick', 'sosickstudios', 'b)ncpmHrgZGibtJ(uR', {
  dialect:  'postgres',
  protocol: 'postgres',
  port:     5432,
  host:     '69.164.203.35'
});

//var sequelize = new Sequelize('postgres://69.164.203.35:5432/trainify?username=sosickstudios');
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

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

module.exports = lodash.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db);