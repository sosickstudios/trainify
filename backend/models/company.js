
module.exports = function (sequelize, DataTypes){

  var Company = sequelize.define('company', {
    id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bio:        { type: DataTypes.TEXT },

    //Location Fields
    city:       { type: DataTypes.STRING },
    province:   { type: DataTypes.STRING },
    state:      { type: DataTypes.STRING },
    street:     { type: DataTypes.STRING },
    zip:        { type: DataTypes.STRING },

    logo:       { type: DataTypes.STRING },
    name:       { type: DataTypes.STRING }
  });

  return Company;
};

