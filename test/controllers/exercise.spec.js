var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var request = require('supertest');
var rewire = require('rewire');
var Promise = require('bluebird');
var sequelize = require('./../../backend/plugins/db');
var testutils = require('./../testutils');


describe('exercise controller', function(){

  describe('/exercise', function(){
    // Require the startup script to build a test database.
    require('./../startup');

    var training = null;
    beforeEach(function(done){
      var Category = require('./../../backend/models/category');
      var Training = require('./../../backend/models/training');
      
      Training.find({where: {name: 'Test Course'}, include: [{model: Category, where: {path: ','}}]}).then(function(result){
        training = result;
        done();
      });
    });

    it('should get the exercise view', function(done){
      var view = new RegExp('<div class=\"exercise\">');
      var urlString = '/exercise?trainingId=' + training.id + '&type=Exam%20Prep&tree=matrix';
      

      testutils.setUser().then(function(){
          request(global.app)
                  .get(urlString)
                  .expect('Content-Type', 'text/html; charset=utf-8')
                  .expect(200, done);
      });
    });

  }); // describe('/exercise')

}); // describe('exercise controller')
