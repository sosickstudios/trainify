var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var _         = require('lodash');
var path      = require('path');
var config    = require('config').db;

var db        = {};

var sequelize = new Sequelize(config.name, config.user, config.password, {
  dialect:  'postgres',
  protocol: 'postgres',
  port:     config.port,
  host:     config.host,
  logging:  false,
  pool:     { maxConnections: 5, maxIdleTime: 30 }
});

module.exports = global.db = _.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db);
