/**
 * app/flux/actions/DashActionCreators
 *
 */
"use strict";

const DashAPI = require('../API/DashAPI');
const Dispatcher = require('../dispatcher');
const Constants = require('../constants').ActionTypes;

module.exports = {
    receiveCourseData: (data) => {
        Dispatcher.handleServerAction({
            type: Constants.DASH_COURSE_RECEIVE,
            data: data
        });
    }
};