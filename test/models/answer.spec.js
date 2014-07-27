var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Answer = require('./../../backend/models/answer');
var Question = require('./../../backend/models/question');

describe('answer model', function(){
  it('should have a model', function(){
    var answer = Answer.build();
    answer.should.exist;
  });

  it('should create a unique id', function(done){
    sequelize.transaction(function(t){
      Answer.create({}, { transaction: t }).success(function(answer){
        answer.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save the chosen answer, number, and result.', function(done){
    var fields = {
      chosen: 'This is the chosen answer.',
      number: 25,
      result: true
    };

    sequelize.transaction(function(t){
      Answer.create(fields, { transaction: t }).success(function(answer){
        answer.should.have.properties(fields);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save the associated question to an instanced answer', function(done){

    sequelize.transaction(function(t){

      Question.create({}, { transaction: t }).success(function (question) {
        question.id.should.be.greaterThan(0);

        Answer.create({ questionId: question.id}, { transaction: t }).success(function (answer){
          answer.id.should.be.greaterThan(0);
          answer.questionId.should.be.greaterThan(0);

          t.rollback().success(function(){done()});
        });
      });
    });
  });
});