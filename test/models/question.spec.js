// var assert = require('assert');
// var sinon = require('sinon');
// var should = require('should');
// var sequelize = require('./../../backend/plugins/db');
// var Question = require('./../../backend/models/question');
//
// describe('question model', function(){
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
//     var question = Question.build();
//     question.should.exist;
//   });
//
//   it('should create a unique id', function(done){
//     Question.create({}, { transaction: transaction }).success(function(question){
//       question.id.should.be.greaterThan(0);
//       done();
//     });
//   });
//
//   it('should save all fields for the model', function(done){
//     var baseQuestion = {
//       figure: 'This is the figure url',
//       text: 'This is the question text',
//       answer: {
//         type: 'multiple',
//         values: [
//           { id: 1, text: 'correct answer', explanation: 'this is why', isCorrect: true },
//           { id: 2, text: 'incorrect answer', explanation: 'because', isCorrect: false },
//           { id: 3, text: 'incorrect', explanation: 'because again', isCorrect: false },
//           { id: 4, text: 'This is another', explanation: 'Bryce says so', isCorrect: false}
//         ]
//       }
//     };
//
//     Question.create(baseQuestion, { transaction: transaction }).success(function(question){
//       question.should.have.properties(baseQuestion);
//       done();
//     });
//   });
//
//   it('should update a questions answer', function(done){
//     var baseQuestion = {
//       figure: 'This is the figure url',
//       text: 'This is the question text',
//       answer: {
//         type: 'multiple',
//         values: [
//           { id: 1, text: 'correct answer', explanation: 'this is why', isCorrect: true },
//           { id: 2, text: 'incorrect answer', explanation: 'because', isCorrect: false },
//           { id: 3, text: 'This is a incorrect', explanation: 'because again', isCorrect: false},
//           { id: 4, text: 'This is another', explanation: 'Bryce says so', isCorrect: false}
//         ]
//       }
//     };
//
//     Question.create(baseQuestion, {transaction: transaction}).then(function(question){
//       question.should.have.properties(baseQuestion);
//
//       baseQuestion.answer.values[0].text = 'Correct answer text';
//
//       return Question.update(baseQuestion, {id: question.id}, {returning: true, transaction: transaction});
//     }).then(function(affected){
//       affected.should.equal(1);
//       done();
//     }).catch(done);
//   });
//
//   it('should check type enum', function(done){
//     var baseQuestion = {
//       type: Question.TYPE.BOOLEAN
//     };
//
//     Question.create(baseQuestion, { transaction: transaction }).success(function(question){
//       question.type.should.equal(Question.TYPE.BOOLEAN);
//       done();
//     });
//   });
// });
