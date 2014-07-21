var passwordless = require('passwordless');
var config = require('config');
var fs = require('fs');
var path = require('path');
var RedisStore = require('passwordless-redisstore');

var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(config.mandrill);

var deliveryTemplate = fs.readFileSync(path.resolve(__dirname + '/../emails/login.html'), 'utf-8');

// Ensure we use a database to back up our tokens.
passwordless.init(new RedisStore(config.port, config.host, {redisstore: {
  database: 15
}}), {
  allowTokenReuse: true
});

passwordless.addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
        console.log('Send %d to %s', tokenToSend, recipient);

        var host = process.env.NODE_ENV === 'production' ? 'https://trainify.io' : 'http://localhost:6158';
        var link = host + '/login?token=' + tokenToSend + '&uid=' + encodeURIComponent(uidToSend);

        var message = deliveryTemplate
          .replace(/{{login}}/g, link)
          .replace(/{{email}}/g, encodeURIComponent(recipient));

        var msg = {
          html: message,
          subject: 'Login to Trainify',
          from_email: 'support@trainify.io',
          to: [{email: recipient, type: 'to'}]
        };

        mandrill_client.messages.send({
          message: msg,
          async: false
        }, function(){
          callback();
        }, function(err){
          console.log(JSON.stringify(err));
          callback(err);
        });
    }, {ttl: 1000*60*60*24*60});

global.app.use(passwordless.sessionSupport());
//global.app.use(passwordless.acceptToken({successRedirect: '/protect'}));

app.get('/login', passwordless.acceptToken({allowPost: true}), function(req, res, next){
  res.redirect('/');
});

app.get('/logout', passwordless.logout(), function(req, res){
    res.redirect('/');
});

app.get('/account', passwordless.restricted(), function(req, res, next){
  console.log(req.user);
  res.send(200);
});

app.use(function(req, res, next){
    if (req.user){
      global.plugins.db.user.find(req.user)
          .then(function(user){
            res.locals.user = user;
            var gravatar = require('gravatar');
            console.log(gravatar.url(user.email, {}, true));
            next();
          });
    } else {
      next();
    }
});
