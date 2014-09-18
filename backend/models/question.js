var _ = require('lodash');
var Sequelize = require('sequelize');
var sequelize = require('../plugins/db');

module.exports = function (){
  // Different Types of Questions
  var TYPE = {
    BOOLEAN: 'bool',
    MULTIPLE: 'multiple'
  };

  var Question = sequelize.define('question', {
    id:               { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    figure:           { type: Sequelize.STRING },
    path:             { type: Sequelize.STRING },
    explanation:      { type: Sequelize.TEXT },
    text:             { type: Sequelize.TEXT },
    type:             { type: Sequelize.ENUM, values: _.values(TYPE),defaultValue: TYPE.MULTIPLE },
    answer: {
      type: Sequelize.TEXT,
      get: function(){
          return JSON.parse(this.getDataValue('answer'));
      },
      set: function(data){
          return this.setDataValue('answer', JSON.stringify(data));
      }
    }
  });

  //  Assign the Type object to our model.
  Question.TYPE = TYPE;

  return Question;
}();
