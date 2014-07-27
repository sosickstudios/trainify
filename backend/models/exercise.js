var _ = require('lodash');
var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

// Different Types of Exercises
var type = {
  PREP: 'Exam Prep',
  PRACTICE: 'Practice'
};

var Exercise = sequelize.define('exercise', {
  id:         { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

  //Progress of the DataTypes
  completed:  { type: Sequelize.DATE, defaultValue: null },
  index:      { type: Sequelize.INTEGER, defaultValue: 0 },
  score:      { type: Sequelize.INTEGER, defaultValue: 0 },

  path:       { type: Sequelize.STRING },
  type:       { type: Sequelize.ENUM, values: _.values(type), default: type.practice }
});

// Assign the Type Object to our model
Exercise.TYPE = type;

module.exports =  Exercise;