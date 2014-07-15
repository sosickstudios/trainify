var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');

describe('answer model', function(){

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
    var answer = db.answer.build();
    answer.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      db.answer.create({}, { transaction: t }).success(function(answer){
        answer.id.should.be.greaterThan(1);

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

    db.sequelize.transaction(function(t){
      db.answer.create(fields, { transaction: t }).success(function(answer){   
        answer.should.have.properties(fields);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save the associated question to an instanced answer', function(done){

    db.sequelize.transaction(function(t){

      db.question.create({}, { transaction: t }).success(function (question) {
        question.id.should.be.greaterThan(1); 
        
        db.answer.create({ questionId: question.id}, { transaction: t }).success(function (answer){
          answer.id.should.be.greaterThan(1);
          answer.questionId.should.be.greaterThan(1);

          t.rollback().success(function(){done()});
        });
      });
    });
  });
});