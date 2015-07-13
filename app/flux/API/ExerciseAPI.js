/**
 * app/flux/API/ExerciseAPI.js
 *
 */
'use strict';

const BaseAPI = require('./BaseAPI');
const ExerciseStore = require('../stores/ExerciseStore');

const Exercise = {
    get: {
        /**
         * Request to retrieve a new exercise.
         *
         * @param {String} category SQL Id of category to retrieve exercise for.
         * @param {Number} total Number of questions for exercise to contain.
         * @param {String} training Training Course that the exercise belongs to.
         * @param {String} tree Type of tree to generate for.
         * @param {String} type Is this a practice or exam setup.
         * @returns {Object.<Exercise>} Representation of the exercise.
         */
        exercise: (category, total, training, tree, type) =>{
            const method = 'GET';
            let url = '/api/exercise';

            url = training ? url + '?trainingId=' + training : url;
            url = category ? url + '&category=' + category : url;
            url = tree ? url + '&tree=' + tree : url;
            url = total ? url + '&total=' + total : url;
            url = type ? url + '&type=' + type : url;

            return BaseAPI.request(url, method);
        }
    },
    put: {
        exercise: (exerciseId) =>{
            if (!exerciseId){
                exerciseId = ExerciseStore.exercise.id;
            }
            const method = 'PUT';
            const body = { id: exerciseId };

            return BaseAPI.request('/api/exercise', method, body);
        },
        question: (questionId, answer) =>{
            const { exercise } = ExerciseStore;
            const question = ExerciseStore.getQuestionById(questionId);

            const method = 'PUT';
            const body = {
                id: question.result.id,
                chosen: answer.id,
                exerciseId: exercise.id,
                questionId: question.id
            };

            return BaseAPI.request('/api/exercise/question/${questionId}', method, body);
        }
    }
};

module.exports = Exercise;
