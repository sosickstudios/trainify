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

describe('dash controller', function(){
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
      var companyFields = {
        bio: 'This is a company bio',
        name: 'This is a company name'
      };
      var trainingFields = {
        description: 'This is the training description.',
        name: 'This is the training name.'
      };

      var companyName = new RegExp('<span class=\"name\">Provided By ' + company.name + '</span>');
      var companyBio = new RegExp('<p class="bio">' + company.bio + '</p>');
      var trainingName = new RegExp('<span class=\"name\">' + training.name + '</span>');
      var trainingDescription = new RegExp('<p class=\"description\">' + training.description + '</p>')
      
      sequelize.transaction(function(t){
        Company.create(companyFields, { transaction: t }).success(function (company){
          
          trainingFields.companyId = company.id;
          Training.create(trainingFields, { transaction: t }).success(function(training){
            request(global.app)
              .get('/dash?trainingId=' + training.id)
              .expect(companyName)
              .expect(companyBio)
              .expect(trainingName)
              .expect(200, trainingDescription, function(){
                t.rollback().success(function(){done();});
              });
          }).failure(function(){
            t.rollback.success(function(){done();})
          });      
        });
      });
    });

  }); // describe('/dash')
}); // describe('dash controller')
