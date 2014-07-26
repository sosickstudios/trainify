var _ = require('lodash');

module.exports = function (sequelize, DataTypes){
  // Different Types of Questions
  var TYPE = {
    BOOLEAN: 'bool',
    MULTIPLE: 'multiple'
  };

  var Question = sequelize.define('question', {
    id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bool:             { type: DataTypes.BOOLEAN },
    correctAnswer:    { type: DataTypes.STRING },    
    explanation:      { type: DataTypes.TEXT },
    figure:           { type: DataTypes.STRING },
    incorrectAnswers: { type: DataTypes.ARRAY(DataTypes.STRING) },
    path:             { type: DataTypes.STRING },
    text:             { type: DataTypes.TEXT },
    type:             { type: DataTypes.ENUM, values: _.values(TYPE), defaultValue: TYPE.MULTIPLE }
  });

  //  Assign the Type object to our model.
  Question.TYPE = TYPE;

  return Question;
};