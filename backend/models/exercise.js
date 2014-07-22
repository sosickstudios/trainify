var _ = require('lodash');

module.exports = function(sequelize, DataTypes){
  //Different Types of Exercises
  var TYPE = {
    PREP: 'Exam Prep',
    PRACTICE: 'Practice'
  };

  var exercise = sequelize.define('exercise', {
    id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    //Progress of the exercise
    completed:  { type: DataTypes.DATE, defaultValue: null },
    index:      { type: DataTypes.INTEGER, defaultValue: 0 },
    score:      { type: DataTypes.INTEGER, defaultValue: 0 },

    path:       { type: DataTypes.STRING },
    type:       { type: DataTypes.ENUM, values: _.values(TYPE), default: TYPE.practice }
  });

  //Assign the Type Object to our model
  exercise.TYPE = TYPE;

  return exercise;
};