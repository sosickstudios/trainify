/**
 * trainify/backend/main.js
 */
'use strict';

process.env.NODE_ENV = 'development';
// Start our monitoring platform.
if (process.env.NODE_ENV === 'production'){
    require('newrelic');
}

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var session = require('express-session');

var app = {
    config: require('config'),
    gracefullClosing: false,
    servers: {}
};

exports = module.exports = app;

app.attachMiddleware = function AttachMiddleware(){
    var expressApp = app.servers.express;

    // Store the session configuration information so we
    // can modify it if in a secure environment.
    var sessionConfig = {
        secret: app.config.server.session,
        saveUninitialized: true,
        resave: true
    };

    if (process.env.NODE_ENV === 'production'){
        // If in production, only use secure cookies.
        expressApp.set('trust proxy', 1);
        expressApp.enable('trust proxy');
        sessionConfig.cookie = {
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 60
        };
        sessionConfig.proxy = true;
        sessionConfig.key = 'session.sid';
    }

    // Use redis for the session.
    var RedisStore = require('connect-redis')(session);

    sessionConfig.store = new RedisStore({
        host: app.config.redis.host,
        port: app.config.redis.port,
        pass: app.config.redis.pass
    });

    expressApp.use(bodyParser.json());
    expressApp.use(bodyParser.urlencoded({extended: true}));
    expressApp.use(cookieParser());

    // If on production, force the cookie to be HTTPS only.
    expressApp.use(session(sessionConfig));

    expressApp.use(function(req, res, next){
        res.locals.isDevelopment = process.env.NODE_ENV !== 'production';
        next();
    });

    if (process.env.NODE_ENV !== 'production'){
      // Normalize the path to get to the sibling expressApp directory.
        expressApp.use(express.static(path.normalize(path.join(__dirname, '/../app'))));
    }

    // If the server has been asked to gracefully shutdown then we should
    // make sure to tell new clients not to use this server. Upstream in
    // NGINX that should signal to route to a different instance.
    expressApp.use(function(req, res, next){
        if (app.gracefullyClosing){
            res.setHeader('Connection', 'close');
            res.send(502, 'Server is in the process of restarting');
            return;
        }

        next();
        return;
    });
};

app.run = function RunApplication(){
    app.servers.express = express();

    app.attachMiddleware();
    require('./plugins/db');
    require('./plugins/passwordless')(app.servers.express);
    require('./routes')(app.servers.express);
    require('./plugins/logger')(app.servers.express);

    // If on DEV then we dont want to limit requests to localhost, in order to allow
    // us to test mobile devices. In production, we only accept requests from localhost, which
    // works since all requests get reverse proxied through NGINX.
    var host = process.env.NODE_ENV === 'production' ? 'localhost' : null;

    var httpServer = app.servers.express.listen(app.config.server.port, host);
    console.log('Listening on port %d', app.config.server.port);

    // Allow graceful shutdown.
    process.on('SIGTERM', function(){
        console.log('Received kill signal, shutting down gracefully.');
        app.gracefullyClosing = true;

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
};
