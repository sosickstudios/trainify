var passwordless = require('passwordless');
var config = require('config');
var fs = require('fs');
var path = require('path');
var hbs = require('hbs');
var Mandrill = require('mandrill-api/mandrill');
var mandrill = new Mandrill.Mandrill(config.mandrill);

var RedisStore = require('passwordless-redisstore');
var User = require('../models/user');

// Get our email login/signup template ready.
var deliveryTemplate = fs.readFileSync(path.resolve(__dirname + '/../emails/login.html'), 'utf-8');
var deliveryCompiled = hbs.handlebars.compile(deliveryTemplate);

// Ensure we use a database to back up our tokens.
passwordless.init(new RedisStore(config.port, config.host, {redisstore: {database: 15}}),
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
 */
function handlePerformDelivery(token, uid, recipient, callback){
  // Determine the host to send to.
  var host = process.env.NODE_ENV === 'production' ?
      'https://trainify.io' :
      'http://localhost:6158';

  // Ex: http://localhost:6158/login?token=00f3e5a9-9e80-4834-bd8e-ea0ff6bb660d&uid=59
  var link = host + '/login?token=' + token + '&uid=' + encodeURIComponent(uid);

  var body = deliveryCompiled({
    login: link,
    email: encodeURIComponent(recipient)
  });

  var message = {
    html: body,
    subject: 'Login to Trainify',
    from_email: 'support@trainify.io',
    to: [{email: recipient, type: 'to'}]
  };

  // Send the email to the user, we are binding callback as we want to ensure it is called with
  // no parameters.
  mandrill.messages.send(
      {message: message, async: true},
      callback.bind(callback, null),
      callback,
      {ttl: 1000*60*60*24*60});
}

// Register our delivery handler.
passwordless.addDelivery(handlePerformDelivery);

var Access = require('./../models/access');
module.exports = function registerPasswordless(app){
  // When a token is authenticated, allows for the tokens to persist across instances. Specifically
  // this will assign a value to the req.user for the ID of the user.
  app.use(passwordless.sessionSupport());

  app.use(function(req, res, next){
      if (req.user){
        // If we have a user, assign the full user to the locals.
        User.find({ where: {id: req.user}, include: [{model: Access, as: 'access'}]})
            .then(function(user){
              res.locals.user = user;
              next();
            });
      } else {
        next();
      }
  });
};
