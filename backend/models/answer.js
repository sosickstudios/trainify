module.exports = function(sequelize, DataTypes){
  var answer = sequelize.define('answer', {
    id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chosen: { type: DataTypes.TEXT },
    number: { type: DataTypes.INTEGER },
    result: { type: DataTypes.BOOLEAN, defaultValue: null }
  });

  return answer;
};