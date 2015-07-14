/**
 * trainify/test/models/access.spec.js
 */
'use strict';

require('assert');
require('sinon');
require('should');

var sequelize = require('./../../backend/plugins/db');
// var Access = require('./../../backend/models/access');

describe('access model', function(){
    var transaction;

    beforeEach(function(done){
        sequelize.transaction(function(t){
            transaction = t;
            done();
        });
    });

    afterEach(function(done){
        transaction.rollback().success(function(){
            done();
        });
    });

    // it('should have a model', function(){
    //     var access = Access.build();
    //     access.should.exist;
    // });
    //
    // it('should create a unique id', function(done){
    //     Access.create({}, { transaction: transaction }).success(function(access){
    //         access.id.should.be.greaterThan(0);
    //         done();
    //     });
    // });
    //
    // it('should default start date to today', function(done){
    //     Access.create({}, { transaction: transaction }).success(function(access){
    //         var today = (new Date()).getDate();
    //         access.start.getDate().should.equal(today);
    //         done();
    //     });
    // });
    //
    // it('should save the end date', function(done){
    //     var today = new Date();
    //     var presets = {
    //         end: today
    //     };
    //
    //     Access.create(presets, { transaction: transaction }).success(function(access){
    //         access.start.getDate().should.equal(today.getDate());
    //         access.end.toString().should.equal(presets.end.toString());
    //         done();
    //     });
    // });

});
