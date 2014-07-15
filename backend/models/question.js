var _ = require('lodash');

module.exports = function(sequelize, DataTypes){
  // Different Types of Questions
  var TYPE = {
    BOOLEAN: 'bool',
    MULTIPLE: 'multiple'
  };

  var question = sequelize.define('question', {
    id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    answer: {
    	type: DataTypes.STRING,
    	get: function () {
    		return JSON.parse(this.answer);
    	}, 
    	set: JSON.stringify
    },
    explanation:  { type: DataTypes.TEXT },
    figure:       { type: DataTypes.STRING },
    path:         { type: DataTypes.STRING },
    text:         { type: DataTypes.TEXT },
    type:         { type: DataTypes.ENUM, values: _.values(TYPE), defaultValue: TYPE.MULTIPLE }
  });

  //Assign the Type object to our model.
  question.TYPE = TYPE;

  return question;
};