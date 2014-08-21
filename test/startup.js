var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var hbs = require('hbs');
var cookieParser = require('cookie-parser');
var _ = require('lodash');

before(function(done){
  // For testing we always start with an empty DB, so force synchronize
  // so that we can ensure all of the tables are created.
  if (process.env.NODE_ENV === 'testing' || true){
    var sequelize = require('../backend/plugins/db');

    sequelize.sync({force: true}).then(function(){
        var importer = require('./../import');
        importer.all().then(function(){
            done();
        });
    }, done);
    return;
  }

  done();
});

beforeEach(function(){
  var app = global.app = express();
  app.set('view engine', 'hbs');

  hbs.localsAsTemplateData(app);

  var fs = require('fs');
  var path = require('path');
  var partialsPath = path.resolve('./views/partials/');
  var header = fs.readFileSync(partialsPath + '/header.hbs', 'utf-8');
  var footer = fs.readFileSync(partialsPath + '/footer.hbs', 'utf-8');

  hbs.registerPartial('header', header);
  hbs.registerPartial('footer', footer);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(cookieParser());

  app.use(session({
    secret: 'unittest',
    saveUninitialized: false,
    resave: false
  }));

  app.use(function(req, res, next){
    if (app.locals){
        res.locals = app.locals;
    }

    next();
  });

  require('../backend/plugins/passwordless')(app);
  require('../backend/plugins/db');
});
