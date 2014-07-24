var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');
var Question = db.question;

describe('question model', function(){

  before(function(done){
    if (process.env.NODE_ENV !== 'testing'){
      return done();
    }

    db.sequelize
      .sync({force: true})
      .complete(function(){
        done();
      });
  });

  it('should have a model', function(){
    var question = Question.build();
    question.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      Question.create({}, { transaction: t }).success(function(question){
        question.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save all fields for the model', function(done){
    var baseQuestion = {
      // answer: { correct: 'This is the correct answer', incorrect: [ 'One Incorrect', 'Two Incorrect']},
      explanation: 'This is a fake explanation',
      figure: 'This is the figure url',
      path: 'Fake Path',
      text: 'This is the question text', 
    };

    db.sequelize.transaction(function(t){
      Question.create(baseQuestion, { transaction: t }).success(function(question){
        question.should.have.properties(baseQuestion);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should check type enum', function (done){
    var baseQuestion = {
      type: Question.TYPE.BOOLEAN
    };

    db.sequelize.transaction(function(t){
      Question.create(baseQuestion, { transaction: t }).success(function(question){
        question.type.should.equal(Question.TYPE.BOOLEAN);

        t.rollback().success(function(){done()});
      });
    });
  });
});