var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');

describe('company model', function(){

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
    var company = db.company.build();
    company.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      db.company.create({}, { transaction: t }).success(function(company){
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
      name: 'Fake Name', 
      adminId: 5
    };

    db.sequelize.transaction(function(t){
      db.company.create(baseCompany, { transaction: t }).success(function(company){
        company.should.have.properties(baseCompany);

        t.rollback().success(function(){done()});
      });
    });
  });
});