
module.exports = function (sequelize, DataTypes){

	var Access = sequelize.define('access', {
		id: 	{ type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		end: 	{ type: DataTypes.DATE, defaultValue: null },
		start: 	{ type: DataTypes.DATE, defaultValue: DataTypes.NOW	}
	});

	return Access;
};


