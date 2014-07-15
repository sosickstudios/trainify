var passwordless = require('passwordless');
var config = require('config');
var RedisStore = require('passwordless-redisstore');

// Ensure we use a database to back up our tokens.
passwordless.init(new RedisStore(config.port, config.host));

passwordless.addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
        console.log('Send %d to %s', tokenToSend, recipient);
    });

global.app.use(passwordless.sessionSupport());
global.app.use(passwordless.acceptToken({successRedirect: '/'}));