var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var request = require('supertest');
var rewire = require('rewire');
var Promise = require('bluebird');
var sequelize = require('./../../backend/plugins/db');

describe.skip('exercise controller', function(){
  describe('/exercise', function(){

    var data = {};
    require('./../mocker')(data);

    it('should get the exercise view', function(done){
      var view = new RegExp('<div class=\"exercise\">');
      var urlString = '/exercise?trainingId=' + data.training.id + '&type=Exam Prep&path=,&category='+ data.root.id;

      request(global.app)
          .get(urlString)
          .expect('Content-Type', 'text/html; charset=utf-8')
          .expect(200, done);
    });

  }); // describe('/exercise')

}); // describe('exercise controller')
