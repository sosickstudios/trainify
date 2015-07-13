/**
 * app/flux/stores/ExerciseStore
 *
 */
'use strict';

const _ = require('lodash');

const Dispatcher = require('../dispatcher');
const Constants = require('../constants');

const ActionTypes = Constants.ActionTypes;
const BaseStore = require('./BaseStore');

/**
 * Add a result object to each question to save the state of the exercise selections.
 *
 * @param {Array.<Question>} questions Array of questions that should be transformed.
 * @returns {Array.<Question>} questions formatted correctly
 */
function formatQuestions(questions){
    return questions.map(question =>{
        question.result = {
            id: null,
            chosen: null,
            correct: null
        };

        return question;
    });
}

/**
 * React Data store for Exercises
 */
class ExerciseStore extends BaseStore{

    constructor(){
        // Call BaseStore Constructor function
        super();

        // This store requires more than the average listeners because of questions, answers.
        this._emitter.setMaxListeners(0);

        this._category = {};
        this._exercise = {};
        this._isReview = false;
        this._questions = [];
        this._training = {};

        /**
         * Register this data store with the dispatcher to catch any events from action creators.
         *
         * @param {Object} payload Dispatched payload from action creator.
         * @returns {undefined} No Payload Data Provided.
         */
        this.dispatchToken = Dispatcher.register(payload =>{
            var action = payload.action;

            switch(action.type){

                /**
                 * User has selected an answer on the current set of questions.
                 *
                 * @type {ActionType}
                 */
                case ActionTypes.EXERCISE_SELECT_ANSWER:

                    let question = _.find(this._questions, {id: action.questionId}, this);
                    question.result.chosen = action.chosen.id;
                    question.result.correct = action.chosen.isCorrect;

                    this.emitChange();
                break;

                /**
                 * The user has answered all exercise questions and exercise has been scored.
                 *
                 * @type {ActionType}
                 */
                case ActionTypes.EXERCISE_COMPLETED:
                    this._exercise = action.exercise;
                    this._isReview = true;

                    this.emitChange();
                break;

                /**
                 * The user has logged out of the system, all data in this store has become irrelevant.
                 *
                 * @type {ActionType}
                 */
                case ActionTypes.USER_LOGOUT:
                    this._destroy();

                    this.emitChange();
                break;
                default:
                // noop
            }
        });
    }

    /**
    * Function to initialize the Exercise Data store.
    *
    * @param {Object} category Category of current exercise (Only Practice)
    * @param {Object} exercise Data of current exercise
    * @param {Array.<Question>} questions Questions for current exercise.
    * @param {Object} training Training course that is being exercised.
    * @returns {undefined} No Payload Data Provided.
    */
    init(category, exercise, questions, training){
        this._category = category;
        this._exercise = exercise;
        this._questions = formatQuestions(questions);
        this._training = training;

        this.emitChange();
    }

    /**
    * Getter to find the count of correctly answered questions.
    *
    * @returns {Number} Number of correctly answered questions.
    */
    get answeredCorrect(){
        return _.where(this._questions, question =>{
            return question.result.correct;
        }).length;
    }

    get category(){
        return this._category;
    }

    /**
    * Determine if the current exercise has been completed based on the percentage answered.
    *
    * @returns {Boolean} Whether the exercise has been completed or not.
    */
    get isCompleted(){
        return this.percentAnswered() === 100;
    }

    get exercise(){
        return this._exercise;
    }

  /**
   * Has the current exercise been completed and scored to switch the state to review mode.
   *
   * @returns {Boolean} Is the exercise in review mode.
   */
    get isReview(){
        return this._isReview;
    }

    get questions(){
        return this._questions;
    }

    /**
    * Calculate the score of the current set of questions.
    *
    * @returns {Number} The running score of the currently answered questions.
    */
    get score(){
        const answeredCorrect = this._questions.filter(question =>{
            return question.result.correct;
        }).length;

        const totalQuestions = this._questions.length;
        let percentage = (answeredCorrect / totalQuestions) * 100;

        return percentage.toFixed();
    }

    get training(){
        return this._training;
    }

    /**
    * Wipe the current data store information.
    * @returns {undefined} No Payload Data Provided.
    */
    _destroy(){
        this._category = {};
        this._exercise = {};
        this._questions = [];
        this._training = {};
        this._isReview = false;
    }

  /**
   * Retrieve Question based on it's database id.
   *
   * @param {Number} id Question database id
   * @returns {Question} Question to be retrieved.
   */
    getQuestionById(id){
        const questions = this._questions;

        return _.find(questions, {id: id});
    }

    /**
    * Calculate the percentage of questions answered for the current question set.
    *
    * @returns {Number} Percentage of questions answered.
    */
    percentAnswered(){
        if (!this._questions.length){
            return 0;
        }

        return this.totalAnswered() / this._questions.length * 100;
    }

    /**
    * Calculate the number of questions that have been answered for the current question set.
    *
    * @returns {Number} Total number of questions answered.
    */
    totalAnswered(){
        return this._questions.filter((question) =>{
            return !!question.result.chosen;
        }).length;
    }
}

module.exports = new ExerciseStore();
