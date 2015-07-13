/**
 * app/flux/actions/ExerciseActionCreators
 *
 */
"use strict";

const Dispatcher = require('../dispatcher');
const ActionTypes = require('../constants').ActionTypes;

const ExerciseAPI = require('../API/ExerciseAPI');
const ExerciseStore = require('../stores/ExerciseStore');

module.exports = {

  /**
   * Action for a user selecting an answer.
   *
   * @param {Number} questionId Database id for the question.
   * @param {Object} answer Selected answer
   */
  clickAnswer: (questionId, answer) => {

    // Create a result for the question.
    ExerciseAPI.put.question(questionId, answer)
      .then(result => {
        
        // Dispatch an action that notifies of the exercise answer being selected.
        Dispatcher.handleViewAction({
            type: ActionTypes.EXERCISE_SELECT_ANSWER,
            chosen: answer,
            questionId: questionId,
            result: result
        });

        // If this question was the last to be completed, score the exercise.
        if(ExerciseStore.isCompleted) {
          ExerciseAPI.put.exercise()
            .then(result => {

              // Dispatch action that notifies that the exercise has been scored.
              Dispatcher.handleServerAction({
                type: ActionTypes.EXERCISE_COMPLETED,
                exercise: result
              });
            });
        }
      })
      .catch(e => {
        Dispatcher.handleServerAction({
          type: ActionTypes.EXERCISE_SELECT_ANSWER_ERROR,
          error: e
        });
      });
  }
};