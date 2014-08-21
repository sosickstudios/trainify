var Promise = require('bluebird');
var User = require('./../backend/models/user');

/**
 * Ensures we set a user on the response, simulating login.
 * @returns {Promise}
 */
module.exports.setUser = function setUser(email){
    email = email || 'testuser@trainify.io';

    return new Promise(function(resolve){
        User.find({email: email}).then(function(user){
            global.app.locals.user = user;
            resolve(user);
        })
    });
};