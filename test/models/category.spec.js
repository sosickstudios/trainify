var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var sequelize = require('./../../backend/plugins/db');
var Category = require('./../../backend/models/category');

describe.only('category model', function(){
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
    var category = Category.build();
    category.should.exist;
  });

  it('should create a unique id', function(done){
    Category.create({}, { transaction: transaction }).success(function(category){
      category.id.should.be.greaterThan(0);
      done();
    });
  });

  it('should save all fields for the model', function(done){
    var baseCategory = {
      description: 'Fake description',
      logo: 'Fake Logo String',
      name: 'Category Name',
      path: 'Path for Category',
      weight: 20
    };

    Category.create(baseCategory, { transaction: transaction }).success(function(category){
      category.should.have.properties(baseCategory);
      done();
    });
  });
});