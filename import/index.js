var Promise = require('bluebird');

var trainingId = 10;
var companyId = 2;

module.exports.all = function(){
  return new Promise(function(resolve){
      module.exports.company().then(function(){
          module.exports.training().then(function(){
              module.exports.categories().then(resolve);
          });
      });
  });
};

module.exports.training = function(){
    require('./../backend/plugins/db');
    var Training = require('./../backend/models/training');
    return new Promise(function(resolve){
        Training.findOrCreate({
            name: 'Test Course',
            description: 'Test Description',
            companyId: companyId
        }).then(function(course){
            trainingId = course.id;
            resolve();
        });
    });
};

module.exports.company = function(){
    require('./../backend/plugins/db');
    return new Promise(function(resolve){
        var Company = require('./../backend/models/company');
        Company.findOrCreate({
            name: 'Trainify',
            bio: 'Trainify Description'
        }).then(function(company){
            companyId = company.id;
            resolve();
        });
    });
};

module.exports.categories = function(){
    //process.env.NODE_ENV = 'remote';
    return new Promise(function(resolve){
        require('./../backend/plugins/db');
        var Category = require('./../backend/models/category');
        var categories = require('./categories');
        var _ = require('lodash');
        var Promise = require('bluebird');

        var topLevelCategories = _.filter(categories, function(category){
            return !category.path;
        });

        var topCategory = topLevelCategories[0];
        var level1Categories = _.filter(categories, function(category){
            return category.path === ',' + topCategory._id.$oid + ',';
        });

        topCategory.trainingId = trainingId;

        Category.create(topCategory).success(function(category){
            var level1Instances = _.map(level1Categories, function(lvl1Cat){
                lvl1Cat.trainingId = trainingId;
                lvl1Cat.parentId = category.id;

                return Category.create(lvl1Cat);
            });

            Promise.all(level1Instances).then(function(lvl1Created){
                _.each(lvl1Created, function(lvl1Cat){
                    var id = lvl1Cat.selectedValues._id.$oid;
                    lvl1Cat = lvl1Cat.toJSON();
                    var lvl2Instances = _.filter(categories, function(category){
                        return category.path === lvl1Cat.path + id + ',';
                    });

                    var lvl2Instances = _.map(lvl2Instances, function(lvl2Cat){
                        lvl2Cat.trainingId = trainingId;
                        lvl2Cat.parentId = lvl1Cat.id;

                        return Category.create(lvl2Cat);
                    });

                    Promise.all(lvl2Instances).then(function(lvl2Created){
                        _.each(lvl2Created, function(lvl2Cat){
                            var id = lvl2Cat.selectedValues._id.$oid;
                            lvl2Cat = lvl2Cat.toJSON();
                            var lvl3Instances = _.filter(categories, function(category){
                                return category.path === lvl2Cat.path + id + ',';
                            });

                            var lvl3Instances = _.map(lvl3Instances, function(lvl3Cat){
                                lvl3Cat.trainingId = trainingId;
                                lvl3Cat.parentId = lvl2Cat.id;

                                return Category.create(lvl3Cat);
                            });

                            Promise.all(lvl3Instances).then(function(){
                                resolve();
                            });
                        });
                    });
                });
            });
        });
    });
};