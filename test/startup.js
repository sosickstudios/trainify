var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var hbs = require('hbs');

before(function(done){
  var fs = require('fs');
  var path = require('path');
  var partialsPath = path.resolve('./views/partials/');
  header = fs.readFileSync(partialsPath + '/header.hbs', 'utf-8');
  footer = fs.readFileSync(partialsPath + '/footer.hbs', 'utf-8');

  hbs.registerPartial('header', header);
  hbs.registerPartial('footer', footer);

  var db = require('./../backend/plugins/db');

  db.sequelize
    .sync({force: true})
    .complete(function(){
      done();
    });
});

beforeEach(function(){
  app = global.app = express();
  app.set('view engine', 'hbs');

  hbs.localsAsTemplateData(app);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  app.use(session({
    secret: 'unittest',
    saveUninitialized: false,
    resave: false
  }));

  global.plugins = require('require-dir')('../backend/plugins');
  global.models = require('require-dir')('../backend/models');
});
