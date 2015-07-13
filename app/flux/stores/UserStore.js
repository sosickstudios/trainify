/**
 * app/flux/stores/UserStore
 *
 */
'use strict';

const Dispatcher = require('../dispatcher');
const Constants = require('../constants');
const BaseStore = require('./BaseStore');
const ActionTypes = Constants.ActionTypes;

/**
 * React Data store for User
 */
class UserStore extends BaseStore {

    constructor(){
        // Call base constructor function.
        super();

        this._failedAttempts = 0;
        this._signupRequestSent = false;
        this._user = null;

        this._pending = false;

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
                * Action for when User fails log in.
                *
                * @type {ActionType}
                */
                case ActionTypes.USER_LOGIN_FAIL:
                    this._failedAttempts++;
                break;

                /**
                 * Action for when User logs in.
                 *
                 * @type {ActionType}
                 */
                case ActionTypes.USER_LOGIN_SUCCESS:
                    this._failedAttempts = 0;
                break;

                /**
                 * Action for when User logs out.
                 *
                 * @type {ActionType}
                 */
                case ActionTypes.USER_LOGOUT:
                    // Send API request that logs user out of server session.
                   this._logout();
                break;

                case ActionTypes.USER_RECEIVE:
                    this._user = action.user;
                    this.emitChange();
                break;
                /**
                 * Action for when a request for Signup has been sent.
                 *
                 * @type {ActionType}
                 */
                case ActionTypes.USER_SIGNUP_PENDING:
                    this._signupRequestSent = true;
                    this.emitChange();
                break;
                default:
                // noop
            }
        });
    }

    get isAuthorized (){
        return !!this._user;
    }

    get isPending (){
        return this._pending;
    }

    get signupPending (){
        return this._signupRequestSent;
    }

    get user(){
        return this._user;
    }

    // Use this setter for the init function.
    set user(user){
        this._pending = false;
        this._user = user;

        this.emitChange();
    }

    /**
    * Erase the store, the user has logged out.
    * @returns {undefined} No Payload Data Provided.
    */
    _logout(){
        this._user = {};
        this.emitChange();
    }
}

module.exports = new UserStore();
