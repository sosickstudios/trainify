/**
 * trainify/backend/controllers/user.js
 */
'use strict';

var express = require('express');
var router = express.Router();

var user = {
    get: function (req, res){
        var localsUser = res.locals.user;
        var response = {
            isAuthorized: !!localsUser,
            user: localsUser
        };

        res.status(200).send(response);
    }
};

// Express route '/api/user'
router.route('/').get(user.get);

module.exports = router;
