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
var db = require('./../../backend/plugins/db');
var User = require('./../../backend/models/user');

describe('home controller', function(){
  describe('/signup', function(){

      it('should get the signup view', function(done){
        var main = new RegExp('<main class=\"signup\">');
        var home = require('./../../backend/controllers/home');

        request(global.app)
            .get('/signup')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(200, main, done);
      });

      it('should send a token for new user', function(done){
        var main = new RegExp('<h1>Almost done!</h1>');
        var home = require('./../../backend/controllers/home');

        app.route('/signup')
          .get(home.get.signup)
          .post(home.post.signup, function(req, res){
            res.render('sent');
          });

        request(global.app)
          .post('/signup')
          .send({email: 'testuser@trainify.io'})
          .expect(200, main, done);
      });

      it('should send a token for an existing user', function(done){
        var main = new RegExp('<h1>Almost done!</h1>');
        var home = require('./../../backend/controllers/home');

        db.sequelize.transaction(function(t){
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

      it('should fail if the database fails', function(done){
        var home = rewire('./../../backend/controllers/home');
        var mockUser = {
          find: function(){
            return Promise.reject('Database failed');
          }
        };

        home.__set__('User', mockUser);

        request(global.app)
          .post('/signup')
          .send({email: 'testuser@trainify.io'})
          .expect(401, done);
      });

      it('should fail if a user is not sent', function(done){
        var home = require('./../../backend/controllers/home');

        app.route('/signup')
          .get(home.get.signup)
          .post(home.post.signup, function(req, res){
            res.render('sent');
          });

        request(global.app)
          .post('/signup')
          .send({name: 'wrong'})
          .expect(400, done);
      });

  }); // describe('/signup')

}); // describe('home controller')
