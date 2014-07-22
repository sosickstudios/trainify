var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');

describe('user model', function(){
  var baseUser = {
    email: 'test@gmail.com',
    name: 'Test User' // TODO: Remove this once marked not-null
  };

  it('should have a model', function(){
    var user = db.user.build();
    user.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      db.user.create(baseUser, { transaction: t }).success(function(user){
        user.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should default isAdmin and isMasterAdmin to false', function(done){
    db.sequelize.transaction(function(t){
      db.user.create(baseUser, { transaction: t }).success(function(user){
        user.isAdmin.should.equal(false);
        user.isMasterAdmin.should.equal(false);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save the name & email', function(done){
    var presets = {
      name: 'Test user',
      email: 'test@trainify.io'
    };

    db.sequelize.transaction(function(t){
      db.user.create(presets, { transaction: t }).success(function(user){
        user.name.should.equal(presets.name);
        user.email.should.equal(presets.email);

        t.rollback().success(function(){done()});
      });
    });
  });

});
