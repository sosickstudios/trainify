var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var express = require('express');
var request = require('supertest');
var session = require('express-session');
var bodyParser = require('body-parser');
var hbs = require('hbs');
var rewire = require('rewire');
var Promise = require('bluebird');
var sequelize = require('./../../backend/plugins/db');
var Category = require('./../../backend/models/category');

describe('stats controller', function(){
  describe('/api/stats/tree', function(){

    var transaction;
    before(function(done){
      sequelize.transaction(function(t){
        transaction = t;
        done();
      });
    });

    after(function(done){
      transaction.rollback.success(function(){done();});
    });

    beforeEach(function(){
      require('./../../backend/routes')(global.app);
    });

    it('should get the stats tree', function(done){
      Category.create({ name: 'Category1' }, {transaction: transaction})
        .then(function(category1){

        });

      request(global.app)
          .get('/signup')
          .expect('Content-Type', 'text/html; charset=utf-8')
          .expect(200, main, done);
    });

    it('should send a token for new user', function(done){
      var main = new RegExp('<h1>Almost done!</h1>');

      request(global.app)
        .post('/signup')
        .send({email: 'testuser@trainify.io'})
        .expect(200, main)
        .end(done);
    });

    it('should send a token for an existing user', function(done){
      var main = new RegExp('<h1>Almost done!</h1>');

      sequelize.transaction(function(t){
        User.create({email: 'testuser@trainify.io'}, { transaction: t }).success(function(user){
          request(global.app)
            .post('/signup')
            .send({email: 'testuser@trainify.io'})
            .expect(200, main, function(){
              t.rollback().success(function(){done();});
            });
        });
      });
    });




  }); // describe('/api/stats/tree')

}); // describe('stats controller')
