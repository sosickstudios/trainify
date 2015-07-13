/**
 * app/flux/stores/DashStore
 *
 */
'use strict';

const Dispatcher = require('../dispatcher');
const Constants = require('../constants');

const ActionTypes = Constants.ActionTypes;
const BaseStore = require('./BaseStore');

/**
 * React Data store for Dash
 */
class DashStore extends BaseStore {

    constructor(){
        // Call BaseStore Constructor function
        super();

        this._categories = [];
        this._stats = {};
        this._training = {};

        /**
         * Register this data store with the dispatcher to catch any events from action creators.
         *
         * @param {Object} payload Dispatched payload from action creator.
         * @returns {undefined} No Paylod Data Provided.
         */
        this.dispatchToken = Dispatcher.register(payload =>{
            var action = payload.action;

            switch(action.type){

                /**
                 * Receive course data that has been received via Server API.
                 *
                 * @type {[type]}
                 */
                case ActionTypes.DASH_COURSE_RECEIVE:
                    let { data } = action;
                    this._catories = data.categories;
                    this._stats = data.stats;
                    this._training = data.training;

                    this.emitChange();
                break;
                /**
                * Action for when training stats are updated.
                *
                * @type {ActionTypes}
                */
                case ActionTypes.TRAINING_STATS_UPDATED:
                    this._categories = action.categories;
                    this._stats = action.stats;
                    this._training = action.training;

                    this.emitChange();
                break;

                /**
                * Action for when User logs out.
                *
                * @type {ActionTypes}
                */
                case ActionTypes.USER_LOGOUT:
                    this._destroy();
                break;
                default:
                // noop
            }
        });
    }

    get data (){
        if (this.isEmpty){
            return {};
        }

        return {
            categories: this._categories,
            training: this._training,
            stats: this._stats
        };
    }

    get isEmpty (){
        return !this._training.name;
    }

    _destroy(){
        this._categories = [];
        this._stats = {};
        this._training = {};

        this.emitChange();
    }
}

module.exports = new DashStore();
