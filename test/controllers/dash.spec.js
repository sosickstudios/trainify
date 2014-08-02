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
var Company = require('./../../backend/models/company');
var Training = require('./../../backend/models/training');

describe.skip('dash controller', function(){
  describe('/dash', function(){

    beforeEach(function(){
      require('./../../backend/routes')(global.app);
    });

    it('should get the dash view', function(done){
      var main = new RegExp('<div class=\"dash\">');

      request(global.app)
          .get('/dash')
          .expect('Content-Type', 'text/html; charset=utf-8')
          .expect(200, main, done);
    });

    it('should retrieve the dash page for a training course', function(done){
      var companyName = new RegExp('<span class=\"provider-name\">');
      var companyBio = new RegExp('<p class="provider-bio">');
      var trainingName = new RegExp('<span class=\"course-name\">');
      var trainingDescription = new RegExp('<p class=\"course-description\">')

      request(global.app)
        .get('/dash')
        .expect(companyName)
        .expect(companyBio)
        .expect(trainingName)
        .expect(200, trainingDescription);
    });

  }); // describe('/dash')
}); // describe('dash controller')
