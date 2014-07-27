var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Exercise = require('./../../backend/models/exercise');

describe('exercise model', function(){

  it('should have a model', function(){
    var exercise = Exercise.build();
    exercise.should.exist;
  });

  it('should create a unique id', function(done){
    sequelize.transaction(function(t){
      Exercise.create({}, { transaction: t }).success(function(exercise){
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

    sequelize.transaction(function(t){
      Exercise.create(baseExercise, { transaction: t }).success(function(exercise){
        exercise.should.have.properties(baseExercise);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save all fields for the model', function(done){
    var baseExercise = {
      type: Exercise.TYPE.PREP,
    };

    sequelize.transaction(function(t){
      Exercise.create(baseExercise, { transaction: t }).success(function(exercise){
        exercise.should.have.properties(baseExercise);

        t.rollback().success(function(){done()});
      });
    });
  });
});