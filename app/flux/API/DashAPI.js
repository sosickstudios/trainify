/**
 * app/flux/API/DashAPI
 *
 */
'use strict';

const BaseAPI = require('./BaseAPI');
const AppActions = require('../actions/AppServerActions');
const Constants = require('../constants').ActionTypes;
const DashActions = require('../actions/DashActionCreators');

const Dash = {
    get: {
        course: (courseName) =>{
            BaseAPI.request('/api/course/' + courseName, 'GET').then(response =>{
                DashActions.receiveCourseData(response);
            }).catch(e =>{
                AppActions.handleServerError(e, Constants.DASH_SERVER_ERROR);
            });
        }
    }
};

module.exports = Dash;
