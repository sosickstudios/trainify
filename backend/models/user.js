
module.exports = function (sequelize, DataTypes){

  var User = sequelize.define('user', {
    id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    email:          { type: DataTypes.STRING },
    isAdmin:        { type: DataTypes.BOOLEAN, defaultValue: false },
    isMasterAdmin:  { type: DataTypes.BOOLEAN, defaultValue: false },
    isUnsubscribed: { type: DataTypes.BOOLEAN, defaultValue: false}
  });

  return User;
};

