var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');

describe('exercise model', function(){

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
    var exercise = db.exercise.build();
    exercise.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      db.exercise.create({}, { transaction: t }).success(function(exercise){
        exercise.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save all fields for the model', function(done){
    var baseExercise = {
      completed: (new Date()),
      index: 1,
      score: 100,
      path: 'Fake Path',
      trainingId: 5,
      userId: 6
    };

    db.sequelize.transaction(function(t){
      db.exercise.create(baseExercise, { transaction: t }).success(function(exercise){
        exercise.should.have.properties(baseExercise);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save all fields for the model', function(done){
    var baseExercise = {
      type: db.exercise.TYPE.PREP, 
    };

    db.sequelize.transaction(function(t){
      db.exercise.create(baseExercise, { transaction: t }).success(function(exercise){
        exercise.should.have.properties(baseExercise);

        t.rollback().success(function(){done()});
      });
    });
  });
});