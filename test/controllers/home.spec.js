var assert = require('assert');
var sinon = require('sinon');
var should = require('should');
var express = require('express');
var request = require('supertest');
var session = require('express-session');
var bodyParser = require('body-parser');
var hbs = require('hbs');

describe('home controller', function(){
  var app, header, footer;

  before(function(){
    var fs = require('fs');
    var path = require('path');
    var partialsPath = path.resolve('./views/partials/');
    header = fs.readFileSync(partialsPath + '/header.hbs', 'utf-8');
    footer = fs.readFileSync(partialsPath + '/footer.hbs', 'utf-8');

    app = global.app = express();
    app.set('view engine', 'hbs');

    var hbs = require('hbs');
    hbs.registerPartial('header', header);
    hbs.registerPartial('footer', footer);

    hbs.localsAsTemplateData(app);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.use(session({
      secret: 'unittest',
      saveUninitialized: false,
      resave: false
    }));

    global.plugins = require('require-dir')('../../backend/plugins');
    global.controllers = require('require-dir')('../../backend/controllers');
  });

  describe('/signup', function(){

      it('should get the signup view', function(done){
        var main = new RegExp('<main class=\"signup\">');

        request(app)
            .get('/signup')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(200, main, done);
      });

      it('should send a token when signup is submitted', function(done){
        var main = new RegExp('<h1>Almost done!</h1>');

        request(app)
          .post('/signup')
          .send({email: 'testuser@trainify.io'})
          .expect(200, main, done);
      });

  }); // describe('/signup')

}); // describe('home controller')
