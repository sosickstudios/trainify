/**
 * app/flux/dispatcher
 *
 */
'use strict';

const Constants = require('./constants');
const Dispatcher = require('flux').Dispatcher;
const assign = require('object-assign');
const PayloadSources = Constants.PayloadSources;

const TrainifyAppDispatcher = assign(new Dispatcher(), {

    /**
    * @param {object} action The details of the action, including the action's
    * type and additional data coming from the server.
    * @returns {undefined} No Payload Data Provided.
    */
    handleServerAction: function(action){
        const payload = {
            source: PayloadSources.SERVER_ACTION,
            action: action
        };
        this.dispatch(payload);
    },

    /**
    * @param {object} action The details of the action, including the action's
    * type and additional data coming from the view.
    * @returns {undefined} No Payload Data Provided.
    */
    handleViewAction: function(action){
        const payload = {
            source: PayloadSources.VIEW_ACTION,
            action: action
        };
        this.dispatch(payload);
    }

});
module.exports = TrainifyAppDispatcher;
