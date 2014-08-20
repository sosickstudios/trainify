var _ = require('lodash');
var Category = require('./../models/category');
var Exercise = require('./../models/exercise');
var express = require('express');
var Promise = require('bluebird');
var Question = require('./../models/question');
var Result = require('./../models/result');
var router = express.Router();
var Training = require('./../models/training');
var utils = require('../utils');

/**
 * Take a set of questions and rank their priority to be drawn from a well. 
 *
 * @param {Array.<Question>} questions Data sent in to be ranked.
 * @param {Array.<Result>} answers Results for questions that a user previously answered.
 * @return {Array.<Question>}
 */
function prioritizeQuestions (questions, answers){
    // Prioritize the questions
    if (!questions || !questions.length){
        return null;
    }

    questions = _(questions).map(function(question){

        // The answers passed in should have the format
        // {
        //      questionId: [Answer],
        // }
        // 
        // We need to check if this question has a set of answers.
        var questionAnswers = answers[question.id] ? answers[question.id] : [];

        // Priority starts at 10, to indicate a high status in case of no answers for question.
        var priorityWeight = 10; 

        var correct = 0;
        var incorrect = 0;

        // Count correct and incorrect answers for specific question.
        _.each(questionAnswers, function (answer){
            
            // If the question was answered correctly, result will be true.
            if (answer.result){
                correct++;
            } else if (answer.result instanceof Boolean && answer.result !== null){
                incorrect++;
            }
        });

        // How many times has the user answered the question.
        var exposureCount = correct + incorrect;

        /**
        *  Tiering system
        *  
        *  Our scale will increase by means of 5 points for each area we wish to add in.
        *  Exposure will be responsible for 5 points, percentage another 5 points, etc
        *
        *  Exposure Granularity Expression: granularity = (5 / highestExposureCount).toFixed(2)
        *  Exposure Properties: {
        *
        *    ***Lowest Priority***                  ***Highest Priority***
        *    highestExposureCount >= exposureCount >= lowestExposureCount
        *
        *    | expression | = Math.abs(expression) //Absolute Value
        *    Equation: exposurePriorityWeight = 
        *        | (exposureCount - highestExposureCount) | * exposureGranularity
        *  }
        * 
        *  Percentage Granularity Expression: granularity = 5 / 100 = 0.05
        *  Each percentage point will be responsible for a 0.05 addition to the scale.
        *  Percentage Properties: {
        *     100 >= percentage >= 90: Lowest Priority ~ 0.00 - 0.5
        *     89 >= percentage >= 80: Higher Priority ~ 0.55 - 1.05
        *     79 >= percentage >= 70: 
        *     69 >= percentage >= 60: 
        *     59 >= percentage >= 50: 
        *     49 >= percentage >= 40:
        *     39 >= percentage >= 30:
        *     29 >= percentage >= 20:
        *     19 >= percentage >= 10:
        *     9 >= percentage >= 0: Highest Priority ~ 4.55 - 5
        *
        *     // Absolute Value
        *     |expression| = Math.abs(expression) 
        *     Equation: percentagePriorityWeight = 
        *         | (decimalPercentage * 100) - 100 | * percentageGranularity
        *  }
        *
        *  Priority Weight Expression: priorityWeight = 
        *      exposurePriorityWeight + percentagePriorityWeight; [0,10]  
        */

        if (exposureCount){

            var highestExposureCount = 0;

            // Find out which question has been answered the most times.
            _.each(answers, function (item) {
                highestExposureCount = item.length > highestExposureCount ? item.length : highestExposureCount;
            });

            var exposureGranularity = (5 / highestExposureCount).toFixed(2);
            var percentageGranularity = 0.05;
            var decimalPercentage = (correct / exposureCount).toFixed(2);

            var exposurePriorityWeight = (Math.abs(exposureCount - highestExposureCount) * exposureGranularity);

            var percentagePriorityWeight = (Math.abs(Math.round(decimalPercentage * 100) - 100) * percentageGranularity);

            // [0,10]
            priorityWeight = exposurePriorityWeight + percentagePriorityWeight;  
        }

        return {
            weight: priorityWeight,
            question: question
        };
    }).sortBy(function (item){
        return -item.weight;
    }).pluck('question').value();

    return questions;
}

/**
 * Class to describe a leaf on a data tree, with the purpose of assigning questions 
 *
 * @param {Category} leaf The category, in parent-child format, to be a leaf.
 * @param {Number} parentTotal Number of questions parent needs to provide.
 * @param {Array.<Question>} leafQuestions Questions that belong to the absolute path of this leaf.
 * @param {Array.<Leaf>} childrenQuestions Leaves that represent children of this path 
 *                                         (This leaf is the parent)
 * @param {[Object.<Question.id, Array.<Result>>]} answers A copy of all answers.
 */
function Leaf(leaf, parentTotal, leafQuestions, childrenQuestions, answers){
    this.leaf = leaf;

    // How many questions does the parent of this leaf have total.
    this.parentTotal = parentTotal;

    // Wells that fall below this leaf on the data tree (Leaf is parent/grandparent/great..)
    this.childrenWells = childrenQuestions || [];

    // Question well that contains all absolute path questions, for this leaf only. We must
    // prioritize the questions for this well. Ranking them in order to smartly generate the 
    // exercise for the pupil.
    this.selfWell = prioritizeQuestions(leafQuestions, answers) || [];
    
    /**
     * Check to see if this leaf has questions left to pull from.
     *
     * @return {Boolean} 
     */
    this.isLeafDry = function (){
        return !this.childrenWells.length && !this.selfWell.length; 
    };
    
    // How many total questions is the leaf responsible for.
    this.leafTotal = Math.round((leaf.weight / 100) * parentTotal); 

    // How many questions are we to pull from the absolute path of this leaf.
    this.selfTake = Math.round(0.25 * this.leafTotal);

    // How many questions are we to draw from the children that fall below this leaf.
    this.childrenTake = Math.round(0.75 * this.leafTotal);

    // Does this leaf have any absolute path questions left to draw from. (Not including children)
    this.isSelfDry = this.selfWell.length === 0;
}

/**
 * Attempt to pull the questions that this leaf is responsible for, as calculated with selfTake
 *
 * @return {Array.<Question>} Array of questions, coming from the highest priority.
 */
Leaf.prototype.getQuestions = function (){
    var questions = [];

    // We can't fulfill the 25% obligation of this leaf.
    if (this.selfWell.length < this.selfTake){ 
        this.selfTake = this.selfWell.length;
    }

    if (!this.isSelfDry){
        questions = this.selfWell.splice(0, this.selfTake);
    }

    _.each(this.childrenWells, function (item, index){
        if (!item.isLeafDry()){
            //Add the children questions from the child well.
            questions = questions.concat(item.getQuestions()); 
        } else{
            //Remove the dry well.
            this.removeChildWell(index); 
        }
    }, this);

    // How many questions are we responsible for, and how many did we provide from this leaf.
    var difference = this.leafTotal - questions.length;
    if (process.env.NODE_ENV === 'development'){
        console.log('Difference %d', difference);
    }

    // If there are children that still have questions to make our difference up.
    if (difference && !this.isLeafDry()){
        // Make sure to flatten the returning well.
        questions = questions.concat(_.flatten(this.pullWellsSync(difference)));
    }

    return _.shuffle(questions);
};

/**
 * Function for producing extra questions in the case that this leaf is asked to provide extra.
 *
 * @param {Number} questionCount Number of questions that this leaf is being asked to provide
 *                               extra.
 * 
 * @return {Array.<Question>}
 */
Leaf.prototype.pullWellsSync = function (questionCount){
    //Pull questions synchronously from the Leaf Well and the Children Wells
    var count = 0;
    var questions = [];

    // Make sure that the well is not dry on each iteration.
    while ((count < questionCount) && !this.isLeafDry()){
        var source = _.random(1);

        // If the random number between [0,1] is 0, pull from the absolute path, or selfwell. 
        // If and only if it has questions
        if ((this.selfWell.length && source === 0) || (!this.childrenWells.length && this.selfWell.length)){
            questions.push(this.selfWell.shift());
            count++;
        }

        // If the random number between [0,1] is 1, pull from our children wells. 
        // If and only if the child wells have questions.
        if((this.childrenWells.length && source === 1) || (!this.selfWell.length && this.childrenWells.length)){

            // To make it as random as possible, randomize which child well we pull from.
            var childSource = _.random(0,this.childrenWells.length - 1);
            var well = this.childrenWells[childSource];

            // Be sure the child well still has questions to pull from.
            if (!well.isLeafDry()){
                // Get all questions from this method, which will call from within the child 
                // leaf.
                questions.push(well.pullWellsSync(1));

                // Check for the well being dry after pulling as well.
                if (well.isLeafDry()){
                    // Remove the well if it has run dry.
                    this.removeChildWell(childSource); 
                }

                // Make sure to increment how many questions that have been pulled, in order
                // to prevent an infinite loop.
                count++;
            } else{
                this.removeChildWell(childSource);
            }      
        }
    }

    return questions;
};

/**
 * In the case that one well dries up, we can remove it.
 *
 * @param {Number} index Index of the well to remove from the children wells.
 */
Leaf.prototype.removeChildWell = function (index){
    this.childrenWells.splice(index, 1);
};

/**
 * Should retrieve all questions for a specific path, and parse them into the Leaf class 
 * under the parent-child format.
 *
 * @param {Number} total Total amount of questions that are for the exercise.
 * @param {Category} leaf The root category, that represents the data tree.
 * @param {Array.<Result>} answers All of the answers that the user has ever created for 
 *                                 this exercise.
 * @return {Leaf}
 */
function getQuestions (total, leaf, answers){
    return new Promise(function (resolve, reject){

        // Find all questions that fall under this leaf.
        var path = leaf.path + leaf.id + ',';
        var queryString = 'path LIKE \'%' + path + '%\'';

        Question.findAll({where: [queryString]}, {raw: true}).then(function (questions){
            // We have committed a raw query which bypasses the getter/setters for sequelize.
            // This is so when we have a high count exercise, the overhead from DAO instances isn't
            // too much. This also allows for the objects returned to be configured more easily.
        
            // Must parse the string that is the anwer.
            questions = _.map(questions, function (question){
                question.answer = JSON.parse(question.answer);
                question.answer.values = _.shuffle(_.values(question.answer.values));

                return question;
            });

            /**
             * Recursive function for taking a tree node and turning it into the Leaf class.
             *
             * @param {Number} parentTotal The amount of questions the parent node of this 
             *                             node is responsible for.
             * @param {Category} leaf Category that represents a node on the data tree.
             * @return {Leaf}
             */
            function initializeLeaves (parentTotal, leaf){
                // The weight that this leaf accounts for amongst its siblings on the data tree.
                var leafWeight = (leaf.weight / 100).toFixed(2);

                // How many questions does this leaf need to provide.
                var weightTotal = Math.round(leafWeight * parentTotal);

                // Make sure we initialize this to an empty array, for the Leaf class.
                var childrenLeaves = [];

                // The function calls the children first, working from the bottom -> top of tree.
                if (leaf.children){
                    // Turn all of the children into the Leaf class by calling this function
                    // recursively.
                    childrenLeaves = _(leaf.children)
                        .map(function(item){
                            item = initializeLeaves(weightTotal, item);
                            return item;
                        })
                        .filter(function (item){
                            // If the leaf has nothing to provide, no reason to pass to Leaf class.
                            return !item.isLeafDry();
                        })
                        .value();
                }

                // The absolute path to this leaf for questions.
                var leafAbsPath = leaf.path + leaf.id + ',';

                // All questions for this leaf.
                var leafQuestions = _.where(questions, {path: leafAbsPath});

                // Return our leaf class.
                return new Leaf(leaf, parentTotal, leafQuestions, childrenLeaves, answers);
            }

            // Since the leaf sent in is the root by default, we want whatever total of questions 
            // to represent 100% of the leaf. (In the case that we have a leaf that is not by 
            // default the root)
            leaf.weight = 100;

            // Turn our data tree into classes.
            leaf = initializeLeaves(total, leaf);

            resolve(leaf);
        })
        .catch(reject);
    });
}

var Tree = require('./../treehelper');
var exercise = {
    /**
     * Route for generating an exercise.
     *
     * URL should be in the following format:
     * 
     * /exercise?category={category.id}&path={category.path}&trainingId={training.id}&type={[
     * Practice, Exam Prep]}
     *
     * @param {Express.request} req Express application request object.
     * @param {Express.response} res Express application response object.
     */
    get: function (req, res){
        //TODO(Bryce) Clean up the parameters that are expected for this route.
        var categoryId = req.query.category;
        var path = req.query.path;
        var trainingId = req.query.trainingId;
        var type = req.query.type || 'Exam Prep';
        var user = res.locals.user;

        var exercise;
        var promises = [
            Exercise.create({userId: user.id, trainingId: trainingId, type: type, path: path}),
            Training.find({where: {id: trainingId}, include: [Category, {model: Exercise, where: {userId: user.id}, include: [Result]}]})
        ];

        // What type of exercise are we generating.
        var isPractice = type === 'Practice';

        // Create our exercise, and find the training course that it belongs to.
        Promise.all(promises).then(function (result){
            // TODO(Bryce) This query needs to be optimized if possible, atm it takes an
            // average of 3.3s -> Main culprit is eager loading.
    
            // Our newly created exercise
            exercise = result[0];

            // Training course, loaded with exercises and results.
            var training = result[1];

            // The second promise was to query all exercises by the user, to get the answers to
            // all previous questions answered.
            var answers = _(training.exercises)
                            .pluck('results')
                            .flatten()
                            .groupBy('questionId')
                            .value();

            // The total amount to draw from questions.
            var total = isPractice ? training.practiceExamTotal : training.structuredExamTotal;

            // console.log(path);
            // Parse our categories into a parent-child format.
            var tree = new Tree(categoryId, null /* path */, training.categories, null /* meta */);

            return getQuestions(total, tree.get(), answers);
        }).then(function (tree){

            // We have the tree set up properly, now get our questions from the (Root).
            var questions = tree.getQuestions();

            // Randomize the questions
            questions = _.shuffle(_.values(questions));

            res.render('exercise', {
                exercise: exercise, 
                questions: questions
            });
        })
        .catch(utils.error);
    },
    put: {
        /**
         * Update an exercise by scoring and adding a completion date, returning the exercise when
         * completed.
         *
         * @param {Express.request} req Express application request object.
         * @param {Express.response} res Express application response object.
         */
        exercise: function (req, res){
            var exerciseId = req.body.id;

            Exercise.find({where: {id: exerciseId}, include: [Result]}).then(function(exercise){
                var correct = _.where(exercise.results, {result: true}).length;
                var score = Math.round((correct / exercise.results.length).toFixed(2) * 100);

                // Score the exercise, based on amount correct vs. incorrect.
                exercise.score = score;
                exercise.completed = new Date();

                return exercise.save();
            }).then(function (exercise){
                res.send(exercise);
            }).catch(utils.apiError);
        },
        /**
         * Update request for an exercise. This will take an object that is expected to be 
         * the Result model. 
         *
         * @param {Express.request} req Express application request object.
         * @param {Express.response} res Express application response object.
         */
        result: function (req, res){
            var questionId = req.params.id;

            // Find the question, make sure to load the answer associated with it.
            Question.find(questionId).then(function (question){
                var update = req.body;
                    
                // The answer the user selected.
                var chosen = _.find(question.answer.values, {id: parseInt(update.chosen, 10)});
                        
                // Each correct answer if flagged by a isCorrect Boolean
                var result = chosen.isCorrect;
               
                // Should this be the second time of updating the result, it will hold an id.
                if(update.id) {
                    return Result.update({result: result, chosen: chosen.id}, {id: update.id}, {returning: true});
                } else {
                    update.result = result;
                    return question.createResult(update);
                }
            }).then(function (){
                res.send(200);
            })
            .catch(utils.apiError);
        }
    }
};

// Express route '/exercise'
router.route('/')
    .get(exercise.get)
    .put(exercise.put.exercise);

// Express route '/exercise/question/:id'
router.route('/question/:id')
    .put(exercise.put.result);

module.exports = router;
