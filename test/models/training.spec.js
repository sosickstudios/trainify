var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Training = require('./../../backend/models/training');

describe('training model', function(){
  var transaction;

  beforeEach(function(done){
    sequelize.transaction(function(t){
      transaction = t;
      done();
    });
  });

  afterEach(function(done){
    transaction.rollback().success(function(){done()});
  });

  it('should have a model', function(){
    var training = Training.build();
    training.should.exist;
  });

  it('should create a unique id', function(done){
    Training.create({}, { transaction: transaction }).success(function(training){
      training.id.should.be.greaterThan(0);
      done();
    });
  });

  it('should save all fields for the model', function(done){
    var baseTraining = {
      description: 'This is a description',
      examTotal: 20,
      logo: 'Fake Logo URL',
      questionId: 6
    };

    Training.create(baseTraining, { transaction: transaction }).success(function(training){
      training.should.have.properties(baseTraining);
      done();
    });
  });
});