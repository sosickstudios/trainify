/**
 * app/flux/stores/AppStore
 *
 */
'use strict';

const BaseStore = require('./BaseStore');

const Dispatcher = require('../dispatcher');
const ActionTypes = require('../constants').ActionTypes;

/**
 * React Data store for Application
 */
class AppStore extends BaseStore {

    constructor(){
        // Call base constructor.
        super();

        // Universal State Variables
        this._navDrawerOpen = false;

        /**
         * Register this data store with the dispatcher to catch any events from action creators.
         *
         * @param {Object} payload Dispatched payload from action creator.
         * @returns {undefined} No Payload data provided.
         */
        this.dispatchToken = Dispatcher.register(payload =>{
            var action = payload.action;

            switch(action.type){
                /**
                * Action for when the navigation drawer has been opened.
                *
                * @type {ActionType}
                */
                case ActionTypes.NAVIGATION_MENU_OPEN:
                    this._navDrawerOpen = true;
                    this.emitChange();
                break;

                /**
                * Action for when navigation drawer has been closed.
                *
                * @type {ActionType}
                */
                case ActionTypes.NAVIGATION_MENU_CLOSE:
                    this._navDrawerOpen = false;
                    this.emitChange();
                break;
                default:
                    // noop
            }
        });
    }

    get navDrawerOpen(){
        return this._navDrawerOpen;
    }
}

module.exports = new AppStore();
