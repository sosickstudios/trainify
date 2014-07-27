var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Company = require('./../../backend/models/company');

describe('company model', function(){

  it('should have a model', function(){
    var company = Company.build();
    company.should.exist;
  });

  it('should create a unique id', function(done){
    sequelize.transaction(function(t){
      Company.create({}, { transaction: t }).success(function(company){
        company.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
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

    sequelize.transaction(function(t){
      Company.create(baseCompany, { transaction: t }).success(function(company){
        company.should.have.properties(baseCompany);

        t.rollback().success(function(){done()});
      });
    });
  });
});