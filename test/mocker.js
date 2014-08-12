var Access = require('./../backend/models/access');
var Category = require('./../backend/models/category');
var Company = require('./../backend/models/company');
var Promise = require('bluebird');
var sequelize = require('./../backend/plugins/db');
var Training = require('./../backend/models/training');
var User = require('./../backend/models/user');


var transaction;

function rollback (cb){
    transaction.rollback().success(function (){cb();})
};



module.exports = function (data){
    /**
     * beforeEach hook to mock a full training course, including a user with access.
     *
     * @param {Function} done Callback to signal that the hook has finished.
     */
    beforeEach(function (done){

        require('./../backend/routes')(global.app);

        sequelize.transaction(function (t){
            transaction = t;

            // We will require a User with Access associated, Company with training course, and a tree
            // of categories that will be associated to the training course.
            var promises = [
                Company.create({
                    name: 'Trainify Testing Company', 
                    description: 'Company Description'
                }, {transaction: transaction}),
                Training.create({
                    name: 'Trainify Testing Course', 
                    description: 'This is the description'
                }, {transaction: transaction}),
                User.create({
                    email: 'testuser@trainify.io'
                }, {transaction: transaction})
            ];

            var access;
            var company;
            var training;
            var user;
            Promise.all(promises).then(function (result){
                /**
                * The result is an array of promises to mock data for a test.
                * 1) {Company} The provider that has been created for the training course.
                * 2) {Training} The training course itself
                * 3) {User} The user to be associated with all the data.
                */
                company = data.company = result[0];
                training = data.training = result[1];
                user = data.user = result[2];

                // Associate all our newly created data appropriately, create the category to be 
                // referenced by the training course (ROOT), and give access to our new course to the
                // user.
                var associations = [
                    Access.create({
                        trainingId: training.id, 
                        userId: user.id, 
                        practiceExamTotal: 4,
                        structuredExamTotal: 4,
                        end: (new Date())},
                    {transaction: transaction}),
                    Category.create({
                        name: 'Root Category',
                        path: ',',
                        trainingId: training.id,
                        weight: 100
                    }, {transaction: transaction}),
                    company.addTraining(training)
                ];

                return Promise.all(associations);
            }).then(function (result){
                /** 
                * The result is an array of finished promises.
                *
                * 1) {Access} For user and training course..
                * 2) {Category} For creating a parent-child data tree
                * 3) {Training} The training course associated, not relevant anymore.
                */

                access = result[0];
                // The root category of the data tree.
                var root = data.root = result[1];

                // The path for the children to be created for the root.
                var childPath = ',' + root.id + ',';

                // Body data for the children categories.
                var categories = [
                    {
                        name: 'Child Category 1', 
                        parentId: root.id, 
                        path: childPath, 
                        weight: 50
                    }, {
                        name: 'Child Category 2',
                        parentId: root.id, 
                        path: childPath,
                        weight: 50
                    }
                ];

                // Create our categories for the children of the root.
                return Category.bulkCreate(categories, {transaction: transaction});
            }).then(function (result){
                var usr = {
                    id: user.id,
                    email: user.email,
                    access: [access]
                };

                global.app.use(function (req, res){
                    res.locals.user = usr;
                });
                
                done();
            });
        });
    });


    afterEach(function (done){
        rollback(done);
    });
};