var passwordless = require('passwordless');
var express = require('express');
var utils = require('../utils');
var router = express.Router();

var User = require('./../models/user');

/**
 * Contains the routes that have custom handling logic.
 * @type {Object}
 */
var signup = {
  /**
   * Gets a token from passwordless, which will look for the users email with the 2nd
   * argument we pass to requestToken. It then goes through some middleware to check the use
   * and allow us to send out our token and then render an appropriate view to the user.
   *
   * @param  {String}   email    The email address to notify.@
   * @param  {Null}     delivery Unknown usage.
   * @param  {Function} next     The function to use to notify once we either create or notify the
   *     user.
   *       - next.error          Any error that may of occured.
   *       - next.user           The ID of the user in question.
   */
  post: passwordless.requestToken(function(email, delivery, next){
    // Get the user, if it doesn't exist we will go ahead and create a new one.
    User.find({ where: {email: email}}).then(function receiveUser(user){
      if (user){
        next(null /* error */, user.id);
      } else {
        User.create({email: email}).then(function createUser(createdUser){
          next(null /* error */, createdUser.id);
        });
      }
    }, next)
  }, {userField: 'email'})
};

router.get('/', utils.render('index'));
router.get('/login', passwordless.acceptToken(), utils.redirect('/'));
router.get('/logout', passwordless.logout(), utils.redirect('/'));

router.route('/signup')
  .get(utils.render('signup'))
  .post(signup.post, utils.render('sent'));

/**
 * This will handle errors that may occur, such as if our database goes down or anything
 * else.
 *
 * @param  {Error}    err  The error that occured.
 */
router.use(function(err, req, res, next){
  res.render('error');
});

module.exports = router;