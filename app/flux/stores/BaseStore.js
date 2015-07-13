/**
 * app/flux/stores/BaseStore
 *
 */
'use strict';

const Dispatcher = require('../dispatcher');
const EventEmitter = require('events').EventEmitter;

const CHANGE_EVENT = 'change';

class BaseStore {

  constructor() {
    this._emitter = new EventEmitter();
  }

    emitChange(data) {
        this._emitter.emit(CHANGE_EVENT, {store: this, ...data});
    }

    addChangeListener (callback) {
        this._emitter.on(CHANGE_EVENT, callback);
    }

    removeChangeListener (callback) {
        this._emitter.removeListener(CHANGE_EVENT, callback);
    }
}

module.exports = BaseStore;
