var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Access = require('./../../backend/models/access');

describe('access model', function(){

  it('should have a model', function(){
    var access = Access.build();
    access.should.exist;
  });

  it('should create a unique id', function(done){
    sequelize.transaction(function(t){
      Access.create({}, { transaction: t }).success(function(access){
        access.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should default start date to today', function(done){
    sequelize.transaction(function(t){
      Access.create({}, { transaction: t }).success(function(access){
        var today = (new Date()).getDate();
        access.start.getDate().should.equal(today);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should save the end date', function(done){
    var today = new Date();
    var presets = {
      end: today
    };

    sequelize.transaction(function(t){
      Access.create(presets, { transaction: t }).success(function(access){
        access.start.getDate().should.equal(today.getDate());
        access.end.toString().should.equal(presets.end.toString());

        t.rollback().success(function(){done()});
      });
    });
  });

});