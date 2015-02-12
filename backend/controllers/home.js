var config = require('config');
var passwordless = require('passwordless');
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Access = require('./../models/access');
var Category = require('./../models/category');
var Company = require('./../models/company');
var Training = require('./../models/training');
var User = require('./../models/user');
var utils = require('../utils');

/**
 * Contains the routes that handle the home routes, so the default / route.
 * @type {Object}
 */
var home = {
  get: function (req, res){
    res.render('index', {});
  }
};

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
    User.findOrCreate({email: email}).then(function receiveUser(user){
      next(null /* error */, user.id);
    }, next);
  }, { userField: 'email' })
};

/**
 * Contains the routes that handle the store routes.
 * @type {Object}
 */
var store = {
    /**
     * Handles getting the training courses and related information for use
     * on the home route.
     *
     * @param {Express.request} req The express request.
     * @param {Express.response} req The express response.
     */
    get: function(req, res){
        Training.findAll({include: [Category, Company]}).success(function(trainings){
            var user = res.locals.user;

            // Ensure we don't throw an error if there is no logged in user.
            if (user && _.any(user.access)){
                trainings.forEach(function(training){
                    var access = _.findWhere(user.access, {trainingId: training.id});

                    training.categories = _.sortBy(training.categories, 'id');
                    training.slug = training.name.replace(/\s/g, '-');

                    if (access){
                        training.hasPurchased = true;
                        training.isAdmin = access.isAdmin;
                    }
                });
            }

            // Assign each category tree to the courses, so we can use it in
            // our templates. For now we just want to go 2 levels deep.
            trainings.forEach(function(training){
                var rootCategory = _.findWhere(training.categories, {parentId: null});

                if (rootCategory){
                    constructCategories(rootCategory, training.categories);
                    training.categories = rootCategory.categories;
                }
            });

            res.render('store', {courses: trainings});
        });
    },

    /**
     * Handles updating a training course for the specified course. Uses a Google Docs
     * spreadsheet to update the course.
     *
     * @param {Express.request} req The express request.
     * @param {Express.response} req The express response.
     */
    updateCourse: function(req, res){
        var gdocs = require('./../gdocs');
        gdocs.updateAll(req.params.id).then(function(){
            res.redirect('/');
        });
    },

    /**
     * Determines the spreadsheet id and redirects to that doc in the current tab.
     *
     * @param {Express.request} req The express request.
     * @param {Express.response} req The express response.
     */
    editCourse: function(req, res){
        var gdocs = require('./../gdocs');
        gdocs.spreadsheet(req.params.id, 'Course Overview').then(function(spreadsheet){
            console.log(spreadsheet.spreadsheetId);
            var url = 'https://docs.google.com/spreadsheets/d/' +
                    spreadsheet.spreadsheetId + '/edit';
            res.redirect(url);
        });
    },

    reloadCourse: function (req, res){
        var gdocs = require('./../gdocs');
        gdocs.reload(req.params.id).then(function (){
            res.redirect('/');
        });
    }
};

/**
 * Constructs a tree hierarchy of the category and it's children.
 * @param category
 * @param categories
 */
function constructCategories(category, categories){
    if (!category) return;

    category.categories = getChildCategories(categories, category.parentId);

    category.categories.forEach(function(child){
        constructCategories(child, categories);
    });
}

/**
 * Gets the child categories out of a full list of categories.
 *
 * @param {Array.<Category>} categories The categories to search through.
 * @param {Number} parentId The parent id to find the children of.
 *
 * @returns {Array.<Category>}
 */
function getChildCategories(categories, parentId){
    // The top level category will be the one with no parentId.
    var rootCategory = _.findWhere(categories, {parentId: parentId});

    // Get all direct children of our root category.
    return _.filter(categories, {parentId: rootCategory.id});
}

/**
 * The user wants to purchase the course specified.
 * @type {{get: Function}}
 */
var buy = {
    get: function(req, res){
        if (!res.locals.user){
            return res.redirect('/signup');
        }

        Training.find(req.param('id')).success(function(training){
            res.render('checkout', {
                training: training,
                stripe: config.stripe.publicKey
            });
        });
    },

    post: function(req, res){
        function completeAccess(){
            Access.create({
                trainingId: req.param('id'),
                userId: res.locals.user.id
            }).success(function(){
                res.redirect('/');
            });
        }
        if (req.param('stripeToken')){
            // Get the training course for the cost and error rendering.
            Training.find(req.param('id')).success(function(training){
                var stripe = require('stripe')(config.stripe.secretKey);

                stripe.charges.create({
                    amount: training.cost * 100,
                    currency: 'usd',
                    card: req.param('stripeToken'),
                    description: res.locals.user.email
                }).then(function(){
                    completeAccess();
                }, function(err){
                    res.render('checkout', {
                        training: training,
                        stripe: config.stripe.publicKey,
                        error: err
                    });
                });
            });
        } else {
            // If no Stripe token exists, then the course is free, so just
            // grant access to the course.
            completeAccess();
        }
    }
};

router.get('/', home.get);
router.get('/login', passwordless.acceptToken(), utils.redirect('/'));
router.get('/logout', passwordless.logout(), utils.redirect('/'));
router.get('/buy/:id', buy.get);
router.post('/buy/:id', buy.post);
router.get('/store', store.get);
router.get('/reloadcourse/:id', store.reloadCourse);
router.get('/updatecourse/:id', store.updateCourse);
router.get('/editcourse/:id', store.editCourse);

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
  res.render('error', {error: err});
});

module.exports = router;
