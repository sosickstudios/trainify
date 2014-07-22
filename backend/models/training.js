module.exports = function(sequelize, DataTypes){
  var training = sequelize.define('training', {
    id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    description:  { type: DataTypes.TEXT },
    examTotal:    { type: DataTypes.INTEGER },
    logo:         { type: DataTypes.STRING },
  });

  return training;
};