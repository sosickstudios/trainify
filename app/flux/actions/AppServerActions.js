/**
 * app/flux/actions/AppServerActions
 */
"use strict";

const Constants = require('../constants').ActionTypes;
const Dispatcher = require('../dispatcher');

module.exports = {

    /**
     * Action to handle an error that has happened from the server.
     *
     * @param {Object} e Error that has occured
     * @param {Object<key>} constant Where the error has occured within the application.
     */
    handleServerError: (e, constant) => {
        Dispatcher.handleServerAction({
            type: constant,
            error: e
        });
    },

    /**
     * Receive User action
     *
     * @param {Object} user 
     */
    receiveUser: (user) => {
        Dispatcher.handleViewAction({
            type: Constants.USER_RECEIVE, 
            user: user
        });
    },

    /**
     * The request for signup has been sent off.
     *
     */
    handleSignupRequestSent: () => {
        // Request for signup has been sent.
        
        Dispatcher.handleServerAction({
            type: Constants.USER_SIGNUP_PENDING
        });
    }
};