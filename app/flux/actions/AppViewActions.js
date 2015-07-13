/**
 * app/flux/actions/AppViewActions
 */
"use strict";

const Constants = require('../constants').ActionTypes;
const Dispatcher = require('../dispatcher');

const AppStore = require('../stores/AppStore');
const UserAPI = require('../API/UserAPI');

module.exports = {

    /**
     * Action to handle an error that has occurred within the application.
     *
     * @param {Object} e Error stemming from application.
     * @param {Object<Key>} constant Constant describing location of error.
     */
    handleViewError: (e, constant) => {
        Dispatcher.handleViewAction({
            type: constant,
            error: e
        });
    },

    /**
     * The navigation menu has been clicked, 
     *
     */
    clickNavigationMenu: () => {
        // Check AppStore for state of navDrawer currently.
        if(!AppStore.navDrawerOpen) {
           Dispatcher.handleViewAction({
               type: Constants.NAVIGATION_MENU_OPEN
           }); 
        } else {
            Dispatcher.handleViewAction({
                type: Constants.NAVIGATION_MENU_CLOSE
            });            
        }
    },

    /**
     * The User has submitted a signup request.
     *
     */
    clickUserSignup: (email) => {
        // Send API request for signup here.
        UserAPI.post(email);
    }
};