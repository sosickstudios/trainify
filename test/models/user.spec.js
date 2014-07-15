var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');

describe('user model', function(){

  before(function(done){
    if (process.env.NODE_ENV !== 'testing'){
      return done();
    }

    db.sequelize
      .sync({force: true})
      .complete(function(){
        done();
      });
  });

  var presets = {
    email: 'test@trainify.io'
  };

  it('should have a model', function(){
    var user = db.user.build();
    user.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      db.user.create(presets, { transaction: t }).success(function(user){
        user.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should default isAdmin, isUnsubscribed and isMasterAdmin to false', function(done){
    db.sequelize.transaction(function(t){
      db.user.create(presets, { transaction: t }).success(function(user){
        user.isAdmin.should.equal(false);
        user.isMasterAdmin.should.equal(false);
        user.isUnsubscribed.should.equal(false);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save the email', function(done){
    db.sequelize.transaction(function(t){
      db.user.create(presets, { transaction: t }).success(function(user){
        user.email.should.equal(presets.email);

        t.rollback().success(function(){done()});
      });
    });
  });
});