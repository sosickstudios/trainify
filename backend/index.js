var express = require('express');
var app = express();
var config = require('config');
var hbs = require('hbs');
var path = require('path');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

// Store the session configuration information so we
// can modify it if in a secure environment.
var sessionConfig = {
  secret: config.server.session,
  saveUninitialized: true,
  resave: true
};

if (process.env.NODE_ENV === 'production'){
  // If in production, only use secure cookies.
  app.set('trust proxy', 1);
  sessionConfig.cookie = {secure: true};
}

// Use redis for the session.
var RedisStore = require('connect-redis')(session);

sessionConfig.store = new RedisStore({
  host: config.redis.host,
  port: config.redis.port,
  pass: config.redis.pass
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// If on production, force the cookie to be HTTPS only.
app.use(session(sessionConfig));

app.get('/api/ping', function(req, res){
  res.send('Date is ' + Date.now());
});

if (process.env.NODE_ENV !== 'production'){
  // Normalize the path to get to the sibling app directory.
  app.use(express.static(path.normalize(__dirname + '/../app')));
}

// Use Handlebars to server our views.
app.set('view engine', 'hbs');

// Make req.locals available to our templates, this is useful as we can
// then bind to things like the current user or course.
hbs.localsAsTemplateData(app);

// Ensure all of the partial views and make them available to all full views.
require('hbs').registerPartials('./views/partials');

// Store this so we know if an attempt to close down gracefully
// is happening.
var gracefullyClosing = false;

// If the server has been asked to gracefully shutdown then we should
// make sure to tell new clients not to use this server. Upstream in
// NGINX that should signal to route to a different instance.
app.use(function(req, res, next){
  if (gracefullyClosing){
    res.setHeader('Connection', 'close');
    res.send(502, 'Server is in the process of restarting');
    return;
  }

  return next();
});

global.app = app;
global.plugins = require('require-dir')('plugins');
global.controllers = require('require-dir')('controllers');

app.get('/', function(req, res, next){
  console.log('User is ', + req.user);
  res.render('index', {
    isDevelopment: process.env.NODE_ENV !== 'production'
  });
});

var httpServer;

global.plugins.db.sequelize
  .sync()
  .complete(function(err){
    if (err) throw err[0];

    httpServer = app.listen(config.server.port, 'localhost');

    console.log('Listening on port %d', config.server.port);
  });

// Allow graceful shutdown.
process.on('SIGTERM', function(){
  console.log('Received kill signal, shutting down gracefully.');

  gracefullyClosing = true;

  // Wait for all open connections to close.
  httpServer.close(function(){
    console.log('Closed out remaining connections.');
    process.exit();
  });

  // Wait 30 seconds before forcefully killing the process.
  setTimeout(function(){
    console.log('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 30 * 1000);
});
