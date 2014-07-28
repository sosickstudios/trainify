var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Company = require('./../../backend/models/company');

describe('company model', function(){
  var transaction;

  beforeEach(function(done){
    sequelize.transaction(function(t){
      transaction = t;
      done();
    });
  });

  afterEach(function(done){
    transaction.rollback().success(function(){done()});
  });

  it('should have a model', function(){
    var company = Company.build();
    company.should.exist;
  });

  it('should create a unique id', function(done){
    Company.create({}, { transaction: transaction }).success(function(company){
      company.id.should.be.greaterThan(0);
      done();
    });
  });

  it('should save all fields for the model', function(done){
    var baseCompany = {
      bio: 'Fake bio',
      city: 'Fake City',
      province: 'Fake Province',
      state: 'Louisiana',
      street: 'Fake Street',
      zip: 'Fake Zip',
      logo: 'Fake Logo',
      name: 'Fake Name'
    };

    Company.create(baseCompany, { transaction: transaction }).success(function(company){
      company.should.have.properties(baseCompany);
      done();
    });
  });
});