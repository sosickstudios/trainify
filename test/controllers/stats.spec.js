// var assert = require('assert');
// var sinon = require('sinon');
// var should = require('should');
// var express = require('express');
// var request = require('supertest');
// var session = require('express-session');
// var bodyParser = require('body-parser');
// var rewire = require('rewire');
// var Promise = require('bluebird');
// var sequelize = require('./../../backend/plugins/db');
// var Category = require('./../../backend/models/category');

// describe.skip('stats controller', function(){
//   describe('/api/stats/tree', function(){

//     var transaction;
//     before(function(done){
//       sequelize.transaction(function(t){
//         transaction = t;
//         done();
//       });
//     });

//     after(function(done){
//       transaction.rollback.success(function(){done();});
//     });

//     beforeEach(function(){
//       require('./../../backend/routes')(global.app);
//     });

//     it('should get the stats tree', function(done){
//       Category.create({ name: 'Category1' }, {transaction: transaction})
//         .then(function(category1){
//           // TODO Inject user into res.locals then retrieve the tree hack(bryce)
//         });

//       request(global.app)
//           .get('/signup')
//           .expect('Content-Type', 'text/html; charset=utf-8')
//           .expect(200, main, done);
//     });
//   }); // describe('/api/stats/tree')

// }); // describe('stats controller')
