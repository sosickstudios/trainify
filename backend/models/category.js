
module.exports = function (sequelize, DataTypes){

	var Category = sequelize.define('category', {
		id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		description:  { type: DataTypes.TEXT },
		logo:         { type: DataTypes.STRING },
		name:         { type: DataTypes.STRING },
		path:         { type: DataTypes.STRING },
		weight:       { type: DataTypes.INTEGER }
	});

	return Category;
};

