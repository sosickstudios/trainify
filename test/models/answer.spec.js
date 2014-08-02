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
    transaction.rollback().success(function (){done()});
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

  it('should save the answer with all possible fields', function(done){
    var fields = {
      bool: true,
      correct: 'This is the correct answer',
      incorrect: ['This is one of the incorrect answers.', 'This is the second incorrect answer.']
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