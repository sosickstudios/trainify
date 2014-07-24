var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var db = require('./../../backend/plugins/db');
var Category = db.category;

describe('category model', function(){

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
    var category = Category.build();
    category.should.exist;
  });

  it('should create a unique id', function(done){
    db.sequelize.transaction(function(t){
      Category.create({}, { transaction: t }).success(function(category){
        category.id.should.be.greaterThan(0);

        t.rollback().success(function(){done()});
      });
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

    db.sequelize.transaction(function(t){
      Category.create(baseCategory, { transaction: t }).success(function(category){
        category.should.have.properties(baseCategory);

        t.rollback().success(function(){done()});
      });
    });
  });
});