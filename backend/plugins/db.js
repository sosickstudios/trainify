/**
 * trainify/backend/plugins/db.js
 */
'use strict';

var Sequelize = require('sequelize');
var config = require('config').db;

var sequelize = new Sequelize(config.name, config.user, config.password, {
    dialect: 'postgres',
    protocol: 'postgres',
    port: config.port,
    host: config.host,
    logging: false,
    pool: { max: 5, idle: 30 }
});
module.exports = sequelize;

var models = require('require-dir')('../models');

// Give the parent-child structure to the category through association.
models.category.hasMany(models.category, { as: 'children', foreignKey: 'parentId'});
models.category.belongsToMany(models.question, {through: models.categoryquestions});
models.category.belongsTo(models.category, { as: 'parent', foreignKey: 'parentId'});

models.company.hasMany(models.training);
models.company.hasMany(models.user, { as: 'administrator', foreignKey: 'adminId'});

models.exercise.belongsTo(models.user);
models.exercise.hasMany(models.result);

models.question.hasMany(models.result);
models.question.belongsToMany(models.category, { through: models.categoryquestions });
models.question.belongsTo(models.category);

models.result.belongsTo(models.exercise);
models.result.belongsTo(models.question);

console.log(models.access);

models.training.belongsTo(models.company);
models.training.hasMany(models.access);
models.training.hasMany(models.exercise);
models.training.hasMany(models.category);

models.user.hasMany(models.access, { as: 'access' });
models.user.hasMany(models.exercise, { as: 'exercises' });
models.user.hasMany(models.result);

// sequelize.sync();

// Object.keys(models).forEach(function(modelName){
//     if ('associate' in models[modelName]){
//         db[modelName].associate(db);
//     }
// });
