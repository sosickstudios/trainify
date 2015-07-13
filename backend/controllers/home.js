/**
 * trainify/backend/controllers/home.js
 */
'use strict';

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

/**
 * Gets the child categories out of a full list of categories.
 *
 * @param {Array.<Category>} categories The categories to search through.
 * @param {Number} parentId The parent id to find the children of.
 *
 * @returns {Array.<Category>} Categories that are children to parent.
 */
function getChildCategories(categories, parentId){
    // The top level category will be the one with no parentId.
    var rootCategory = _.findWhere(categories, {parentId: parentId});

    // Get all direct children of our root category.
    return _.filter(categories, {parentId: rootCategory.id});
}

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
    * @returns {undefined} No payload data provided.
    */
    post: passwordless.requestToken(function(email, delivery, next){
        // Get the user, if it doesn't exist we will go ahead and create a new one.
        User.findOrCreate({where: {email: email}, defaults: {}}).spread(function receiveUser(user){
            next(/* error */ null, user.id);
        }).catch(function (error){
            console.log(error);
            next(error, null /* user.id */);
        });
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
     * @param {Express.response} res The express response.
     * @returns {undefined} No payload data provided.
     */
    get: function(req, res){
        Training.findAll({include: [Category, Company]}).then(function(trainings){
            var user = res.locals.user;

            // Ensure we don't throw an error if there is no logged in user.
            if (user && _.any(user.access)){
                trainings.forEach(function(training){
                    training = training.get();

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

            res.status(200).send({courses: trainings});
        });
    },

    /**
     * Handles updating a training course for the specified course. Uses a Google Docs
     * spreadsheet to update the course.
     *
     * @param {Express.request} req The express request.
     * @param {Express.response} res The express response.
     * @returns {undefined} No payload data provided.
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
     * @param {Express.response} res The express response.
     * @returns {undefined} No payload data provided.
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
 * @param {object} category Parent category
 * @param {Array.<Object>} categories possible child categories.
 * @returns {undefined} No payload data provided.
 */
function constructCategories(category, categories){
    if (!category){
        return;
    }

    category.categories = getChildCategories(categories, category.parentId);

    category.categories.forEach(function(child){
        constructCategories(child, categories);
    });
}

/**
 * The user wants to purchase the course specified.
 * @type {{get: Function}}
 */
var buy = {
    get: function(req, res){
        var trainingId = req.params.id;
        Training.find({where: {id: trainingId}}).then(function(training){
            res.status(200).send({
                training: training,
                stripe: config.stripe.publicKey
            });
        }).catch(function (error){
            console.log(error);
        });
    },
    post: function(req, res){
        function completeAccess(){
            Access.create({
                trainingId: req.param('id'),
                userId: res.locals.user.id
            }).then(function(){
                res.redirect('/');
            });
        }
        if (req.param('stripeToken')){
            // Get the training course for the cost and error rendering.
            Training.find(req.param('id')).then(function(training){
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
        } else{
            // If no Stripe token exists, then the course is free, so just
            // grant access to the course.
            completeAccess();
        }
    }
};

router.get('/api/login', passwordless.acceptToken({failureRedirect: '/#/signup', successRedirect: '/#/'}));

router.get('/api/logout', passwordless.logout(), function (req, res){
    res.sendStatus(200);
});

router.get('/api/buy/:id', buy.get);
router.post('/api/buy/:id', buy.post);
router.get('/api/store', store.get);
router.get('/reloadcourse/:id', store.reloadCourse);
router.get('/updatecourse/:id', store.updateCourse);
router.get('/editcourse/:id', store.editCourse);

router.post('/api/signup', signup.post, function(req, res){
    res.status(200).send({success: true});
});

/**
 * This will handle errors that may occur, such as if our database goes down or anything
 * else.
 *
 * @param  {Error}    err  The error that occured.
 * @param {Object} req Express wrapped Request object
 * @param {Object} res Express wrapped Response object
 * @returns {undefined} No payload data provided.
 */
// router.use(function(err, req, res){
//     console.log(err);
//     res.send(500, {error: err});
// });

module.exports = router;
