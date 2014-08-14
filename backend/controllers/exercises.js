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

function getQuestions (parentTotal, leaf, answers) {
    return new Promise(function (resolve, reject){
        var leafWeight = (leaf.weight / 100).toFixed(2);

        // This leaf and its children must sum to this number.
        var weightTotal = Math.round(leafWeight * parentTotal); 

        // Find all questions that fall under this leaf.
        var path = leaf.path + leaf.id + ',';

        Question.findAll({where: {path: path}}, {raw: true}).then(function (questions){
            // We have committed a raw query which bypasses the getter/setters for sequelize.
            // Must parse the string that is the anwer.
            questions = _.map(questions, function (question){
                question.answer = JSON.parse(question.answer);
                question.answer.values = _.shuffle(_.values(question.answer.values));

                return question;
            });

            //If the leaf has children, retrieve the questions from the child.
            if(leaf.children && leaf.children.length) {
                Promise.all(_.map(leaf.children, function (item) {
                    return getQuestions(weightTotal, item, answers);
                })).then(function (childrenResults){
                    // filter out any empty leaves that can't provide questions.
                    childrenResults = _.filter(childrenResults, function (item) {
                        return !item.isLeafDry();
                    });  

                    var result = new Leaf(leaf, parentTotal, questions, childrenResults, answers);
                    resolve(result);
                }).catch(reject);
            } else {
                var result = new Leaf(leaf, parentTotal, questions, [], answers);
                resolve(result);
            }

        }).catch(reject);
    });
}

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
        var categoryId = req.query.category;
        var path = req.query.path;
        var trainingId = req.query.trainingId;
        var type = req.query.type || 'Exam Prep';
        var user = res.locals.user;

        var exercise;
        var promises = [
            Exercise.create({userId: user.id, trainingId: trainingId, type: type, path: path}, {include: [Training]}),
            Training.find({where: {id: trainingId}, include: [Category, {model: Exercise, where: {userId: user.id}, include: [Result]}]})
        ];

        // What type of exercise are we generating.
        var isPractice = type === 'Practice';

        // If we are in practice mode, then we will need to retrieve the Category.
        if(isPractice){
            promises.push(Category.find(categoryId));
        }

        var questions;
        Promise.all(promises).then(function (result){
            // Our newly created exercise
            exercise = result[0];

            // Training course, loaded with exercises and results.
            var training = result[1];

            // The second promise was to query all exercises by the user, to get the answers to
            // all previous questions answered.
            var answers = _(training.exercises).pluck('results').flatten().groupBy('questionId').value();

            // If we are generating an exam prep, we will use the root category associated to the 
            // training course.
            var category = isPractice ? result[2] : training.category;

            return category.treeLoader().then(function (tree){
                // The total amount to draw from questions.
                var total = isPractice ? training.practiceExamTotal : training.structuredExamTotal;

                // Start the recursive draw of questions from the tree.
                return getQuestions(total, tree, answers);
            });
        }).then(function (tree){
            // We have the tree set up properly, now get our questions from the (Root).
            questions = tree.getQuestions();

            questions = _.shuffle(_.values(questions));

            res.render('exercise', {
                exercise: exercise, 
                questions: questions
            });
        })
        .catch(utils.error);
    },
    /**
     * Update request for an exercise. This will take an object that is expected to be the Result
     * model. 
     *
     * @param {Express.request} req Express application request object.
     * @param {Express.response} res Express application response object.
     */
    put: function (req, res){
        var questionId = req.body.questionId;

        // Find the question, make sure to load the answer associated with it.
        Question.find(questionId)
            .then(function (question){
                var update = req.body;
                
                // The answer the user selected.
                var chosen = _.find(question.answer.values, {id: parseInt(update.chosen, 10)});
                    
                // Each correct answer if flagged by a isCorrect Boolean
                var result = typeof chosen.isCorrect === 'boolean' && chosen.isCorrect;
               
                // Should this be the second time of updating the result, it will hold an id.
                if(update.id) {
                    return Result.update({result: result, chosen: chosen.id}, {id: id}, {returning: true});
                } else {
                    update.result = result;
                    return question.createResult(update);
                }
                
            }).then(function (result){
                // Return a non-DAO instance from sequelize.
                res.json(result.values);
            })
            .catch(utils.error);
    }
};

// Express route '/exercise'
router.route('/')
    .get(exercise.get)
    .put(exercise.put);

module.exports = router;


