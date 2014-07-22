var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');

describe('access model', function(){

  it('should have a model', function(){
    var access = db.access.build();
    access.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      db.access.create({}, { transaction: t }).success(function(access){
        access.id.should.be.greaterThan(1);

        t.rollback().success(function(){done()});
      });
    });
  });

  it('should default start date to today', function(done){
    db.sequelize.transaction(function(t){
      db.access.create({}, { transaction: t }).success(function(access){
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

    db.sequelize.transaction(function(t){
      db.access.create(presets, { transaction: t }).success(function(access){
        access.start.getDate().should.equal(today.getDate());
        access.end.toString().should.equal(presets.end.toString());

        t.rollback().success(function(){done()});
      });
    });
  });

});