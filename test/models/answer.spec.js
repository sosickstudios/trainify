var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Answer = require('./../../backend/models/answer');
var Question = require('./../../backend/models/question');

describe('answer model', function(){
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
    var answer = Answer.build();
    answer.should.exist;
  });

  it('should create a unique id', function(done){
    Answer.create({}, { transaction: transaction }).success(function(answer){
      answer.id.should.be.greaterThan(0);
      done();
    });
  });

  it('should save the chosen answer, number, and result.', function(done){
    var fields = {
      chosen: 'This is the chosen answer.',
      number: 25,
      result: true
    };

    Answer.create(fields, { transaction: transaction }).success(function(answer){
      answer.should.have.properties(fields);
      done();
    });
  });

  it('should save the associated question to an instanced answer', function(done){
    Question.create({}, { transaction: transaction }).success(function (question) {
      question.id.should.be.greaterThan(0);

      Answer.create(
          { questionId: question.id},
          { transaction: transaction }).success(function (answer){
              answer.id.should.be.greaterThan(0);
              answer.questionId.should.equal(question.id);
              done();
      });
    });
  });
});