/**
 * trainify/test/testutils.js
 */
'use strict';

var Promise = require('bluebird');
var Access = require('./../backend/models/access');
var User = require('./../backend/models/user');

/**
 * Ensures we set a user on the response, simulating login.
 * @param {String} email user email.
 * @returns {Promise} bluebird promise
 */
module.exports.setUser = function setUser(email){
    email = email || 'testuser@trainify.io';

    return new Promise(function(resolve, reject){
        User.find({where: {email: email}, include: [{model: Access, as: 'access'}]})
            .then(function(user){
                global.app.locals.user = user;
                resolve(user);
            }).catch(reject);
    });
};
