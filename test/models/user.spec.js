// var assert = require('assert');
// var sinon = require('sinon');
// var should = require('should');
// var sequelize = require('./../../backend/plugins/db');
// var User = require('./../../backend/models/user');
//
// describe('user model', function(){
//   var transaction;
//
//   var baseUser = {
//     email: 'test@gmail.com'
//   };
//
//   beforeEach(function(done){
//     sequelize.transaction(function(t){
//       transaction = t;
//       done();
//     });
//   });
//
//   afterEach(function(done){
//     transaction.rollback().success(function(){done()});
//   });
//
//   it('should have a model', function(){
//     var user = User.build();
//     user.should.exist;
//   });
//
//   it('should create a unique id', function(done){
//     User.create(baseUser, { transaction: transaction }).success(function(user){
//       user.id.should.be.greaterThan(0);
//       done();
//     });
//   });
//
//   it('should default isAdmin, isUnsubscribed and isMasterAdmin to false', function(done){
//     User.create(baseUser, { transaction: transaction }).success(function(user){
//       user.isAdmin.should.equal(false);
//       user.isMasterAdmin.should.equal(false);
//       user.isUnsubscribed.should.equal(false);
//       done();
//     });
//   });
//
//   it('should save the email', function(done){
//     User.create(baseUser, { transaction: transaction }).success(function(user){
//       user.email.should.equal(baseUser.email);
//       done();
//     });
//   }); // should save the name & email
// });
