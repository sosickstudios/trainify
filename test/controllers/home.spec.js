var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var express = require('express');
var request = require('supertest');
var session = require('express-session');
var bodyParser = require('body-parser');
var hbs = require('hbs');

describe('home controller', function(){
  describe('/signup', function(){

      it('should get the signup view', function(done){
        var main = new RegExp('<main class=\"signup\">');

        request(global.app)
            .get('/signup')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(200, main, done);
      });

      it('should send a token when signup is submitted', function(done){
        var main = new RegExp('<h1>Almost done!</h1>');

        request(global.app)
          .post('/signup')
          .send({email: 'testuser@trainify.io'})
          .expect(200, main, done);
      });

      it('should fail if a user is not sent', function(done){
        request(global.app)
          .post('/signup')
          .send({name: 'wrong'})
          .expect(400, done);
      });

  }); // describe('/signup')

}); // describe('home controller')
