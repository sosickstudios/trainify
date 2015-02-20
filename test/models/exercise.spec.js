// var assert = require('assert');
// var sinon = require('sinon');
// var should = require('should');
// var sequelize = require('./../../backend/plugins/db');
// var Exercise = require('./../../backend/models/exercise');
//
// describe('exercise model', function(){
//   var transaction;
//
//   beforeEach(function(done){
//     sequelize.transaction(function(t){
//       transaction = t;
//       done();
//     });
//   });
//
//   afterEach(function(done){
//     transaction.rollback().success(function(){done()});
//   });
//
//   it('should have a model', function(){
//     var exercise = Exercise.build();
//     exercise.should.exist;
//   });
//
//   it('should create a unique id', function(done){
//     Exercise.create({}, { transaction: transaction }).success(function(exercise){
//       exercise.id.should.be.greaterThan(0);
//       done();
//     });
//   });
//
//   it('should save all fields for the model', function(done){
//     var baseExercise = {
//       completed: (new Date()),
//       index: 1,
//       score: 100,
//       trainingId: 5,
//       userId: 6
//     };
//
//     Exercise.create(baseExercise, { transaction: transaction }).success(function(exercise){
//       exercise.should.have.properties(baseExercise);
//       done();
//     });
//   });
//
//   it('should save all fields for the model', function(done){
//     var baseExercise = {
//       type: Exercise.TYPE.PREP,
//     };
//
//     Exercise.create(baseExercise, { transaction: transaction }).success(function(exercise){
//       exercise.should.have.properties(baseExercise);
//       done();
//     });
//   });
// });
