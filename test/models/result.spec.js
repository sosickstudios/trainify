var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Exercise = require('./../../backend/models/exercise');
var Question = require('./../../backend/models/question');
var Promise = require('bluebird');
var Result = require('./../../backend/models/result');

describe('answer model', function(){
  var transaction;

  beforeEach(function(done){
    sequelize.transaction(function(t){
      transaction = t;
      done();
    });
  });

  afterEach(function(done){
    transaction.rollback().success(function () {done()});
  });

  it('should have a model', function(){
    var result = Result.build();
    result.should.exist;
  });

  it('should create a unique id', function(done){
    Result.create({}, { transaction: transaction }).success(function(result){
      result.id.should.be.greaterThan(0);
      done();
    });
  });

  it('should save the result with all possible fields', function(done){
    var fields = {
      chosen: 'This is the chosen answer',
      number: 5,
      result: true
    };

    Result.create(fields, { transaction: transaction }).success(function(result){
      result.should.have.properties(fields);
      done();
    });
  });

  it('should save the associated question to an instanced result', function(done){
    var promises = [
      Exercise.create({}, {transaction: transaction}),
      Question.create({}, {transaction: transaction})
    ];

    var exercise;
    var question;
    Promise.all(promises).then(function (result){
      exercise = result[0];
      question = result[1];
      
      return Result.create(
          { questionId: question.id, exerciseId: exercise.id},
          { transaction: transaction });
    }).then(function (result){
      result.id.should.be.greaterThan(0);
      result.exerciseId.should.equal(exercise.id);
      result.questionId.should.equal(question.id);
      done();
    }).catch(done).catch(done);
  });
});