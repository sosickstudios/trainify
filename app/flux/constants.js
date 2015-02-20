/**
 * app/flux/constants
 *
 */
'use strict';

const keyMirror = require('keymirror');

module.exports = {

  ActionTypes: keyMirror({
    // Generic Application Actions
    NAVIGATION_MENU_OPEN: null,
    NAVIGATION_MENU_CLOSE: null,

    // DASH ACTION CONSTANTS
    DASH_EXERCISE_TRANSITION: null,
    DASH_COURSE_RECEIVE: null,
    DASH_SERVER_ERROR: null,

    // EXERCISE ACTION CONSTANTS
    EXERCISE_COMPLETED: null,
    EXERCISE_SELECT_ANSWER: null,
    EXERCISE_SELECT_ANSWER_ERROR: null,

    TRAINING_STATS_UPDATED: null,

    // USER AUTH CONSTANTS
    USER_LOGIN: null,
    USER_LOGOUT: null,
    USER_RECEIVE: null,
    USER_SERVER_ERROR: null,
    USER_SIGNUP_PENDING: null
  }),

  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  })
};
