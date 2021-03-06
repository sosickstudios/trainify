/**
 * trainify/backend/plugins/passwordless.js
 */
'use strict';
var passwordless = require('passwordless');
var config = require('config');
var Mandrill = require('mandrill-api/mandrill');
var mandrill = new Mandrill.Mandrill(config.mandrill);

var RedisStore = require('passwordless-redisstore');
var User = require('../models/user');

// Ensure we use a database to back up our tokens.
passwordless.init(new RedisStore(config.redis.port, config.redis.host, {redisstore: {database: 4, tokenKey: 'trainify:'}}),
    {allowTokenReuse: true});

/**
 * Once our login token has been accepted, we will send an email to the user containing
 * our token.
 *
 * @param  {String}   token     The token from passwordless.
 * @param  {String}   uid       The user ID.
 * @param  {String}   recipient The email of the user.
 * @param  {Function} callback  The callback to signal completion, called with an error to signify
 *     an error, or null if called with no arguments.
 * @returns {undefined} No payload data provided.
 */
function handlePerformDelivery(token, uid, recipient, callback){
    // Determine the host to send to.
    var host = process.env.NODE_ENV === 'production' ? 'https://trainify.io' : 'http://localhost:6158';

    // Ex: http://localhost:6158/login?token=00f3e5a9-9e80-4834-bd8e-ea0ff6bb660d&uid=59
    var link = host + '/api/login?token=' + token + '&uid=' + encodeURIComponent(uid);

    var options = {
    'template_name': 'login',
    'template_content': [],
    message: {
        to: [{
            email: recipient,
            type: 'to'
        }],
        'track_clicks': true,
        'track_opens': true,
        'merge_vars': [{
            rcpt: recipient,
            vars: [{
                name: 'login',
                content: link
            }, {
                name: 'email',
                content: recipient
            }]
        }]
    },
    tags: [
    'login'
    ],
    async: true
    };
    // Send the email to the user, we are binding callback as we want to ensure it is called with
    // no parameters.
    mandrill.messages.sendTemplate(options, callback.bind(callback, null), callback,
        {ttl: 1000 * 60 * 60 * 24 * 60});
}

// Register our delivery handler.
passwordless.addDelivery(handlePerformDelivery);

var Access = require('./../models/access');
module.exports = function registerPasswordless(app){
    // When a token is authenticated, allows for the tokens to persist across instances. Specifically
    // this will assign a value to the req.user for the ID of the user.
    app.use(passwordless.sessionSupport());
    // app.use(passwordless.acceptToken());

    app.use(function(req, res, next){
        if (req.user){
            // If we have a user, assign the full user to the locals.
            User.find({ where: {id: req.user}, include: [{model: Access, as: 'access'}]})
                .then(function(user){
                    res.locals.user = user.get();
                    next();
                });
        } else{
            next();
        }
    });
};
