var _ = require('lodash');

module.exports = function (sequelize, DataTypes){

	// Different Types of Exercises
	var TYPE = {
	  PREP: 'Exam Prep',
	  PRACTICE: 'Practice'
	};

	var Exercise = sequelize.define('exercise', {
	  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

	  //Progress of the DataTypes
	  completed:  { type: DataTypes.DATE, defaultValue: null },
	  index:      { type: DataTypes.INTEGER, defaultValue: 0 },
	  score:      { type: DataTypes.INTEGER, defaultValue: 0 },

	  path:       { type: DataTypes.STRING },
	  type:       { type: DataTypes.ENUM, values: _.values(TYPE), default: TYPE.practice }
	});

	// Assign the Type Object to our model
	Exercise.TYPE = TYPE;

	return Exercise;
};
