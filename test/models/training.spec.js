var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');
var Training = db.training;

describe('training model', function(){

  it('should have a model', function(){
    var training = Training.build();
    training.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      Training.create({}, { transaction: t }).success(function(training){
        training.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save all fields for the model', function(done){
    var baseTraining = {
      // answer: { correct: 'This is the correct answer', incorrect: [ 'One Incorrect', 'Two Incorrect']},
      description: 'This is a description',
      examTotal: 20,
      logo: 'Fake Logo URL', 
      questionId: 6
    };

    db.sequelize.transaction(function(t){
      Training.create(baseTraining, { transaction: t }).success(function(training){
        training.should.have.properties(baseTraining);

        t.rollback().success(function(){done()});
      });
    });
  });
});