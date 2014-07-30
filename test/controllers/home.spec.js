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
var User = require('./../../backend/models/user');

describe('home controller', function(){
  describe('/signup', function(){

    beforeEach(function(){
      require('./../../backend/routes')(global.app);
    });

    it('should get the signup view', function(done){
      var main = new RegExp('<main class=\"signup\">');

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

    it('should login', function(done){
      request(global.app)
        .get('/login')
        .end(function(err, res){
          res.header['location'].should.equal('/');
          done();
        });
    });

    it('should show the user', function(done){
      // We have been redirected, let's check our user now
      request(global.app)
        .get('/')
        .expect(/testuser@trainify.io/)
        .end(done);
    });

    it('should fail if a user is not sent', function(done){
      request(global.app)
        .post('/signup')
        .send({name: 'wrong'})
        .expect(400, done);
    });

  }); // describe('/signup')

  describe('signup failure', function(){
    it('should fail if the database fails', function(done){
      var home = rewire('./../../backend/controllers/home');
      var mockUser = {
        find: function(){
          return Promise.reject('Database failed');
        }
      };

      home.__set__('User', mockUser);

      global.app.use('/', home);

      request(global.app)
        .post('/signup')
        .send({email: 'testuser@trainify.io'})
        .expect(/We are having some problems/)
        .end(done);
    });
  }); // describe('signup failure')

}); // describe('home controller')
