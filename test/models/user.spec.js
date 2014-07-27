var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var User = require('./../../backend/models/user');

describe('user model', function(){

  var baseUser = {
    email: 'test@gmail.com'
  };

  it('should have a model', function(){
    var user = User.build();
    user.should.exist;
  });

  it('should create a unique id', function(done){
    sequelize.transaction(function(t){
      User.create(baseUser, { transaction: t }).success(function(user){
        user.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should default isAdmin, isUnsubscribed and isMasterAdmin to false', function(done){
    sequelize.transaction(function(t){
      User.create(baseUser, { transaction: t }).success(function(user){
        user.isAdmin.should.equal(false);
        user.isMasterAdmin.should.equal(false);
        user.isUnsubscribed.should.equal(false);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save the email', function(done){
    sequelize.transaction(function(t){

      User.create(baseUser, { transaction: t }).success(function(user){
        user.email.should.equal(baseUser.email);

        t.rollback().success(function(){done()});
      });
    });
  }); // should save the name & email
});
