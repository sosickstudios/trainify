var assert = require('assert');
var sinon = require('sinon');
var should = require('should');

describe('It works', function(){

  it('should work well', function(){
    '1'.should.equal('1');
  });

  it('should spy on stuff', function(){
    var spy = sinon.spy();
    spy.called.should.be.false;
  });

});