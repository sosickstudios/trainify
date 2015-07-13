/**
 * app/flux/API/UserAPI
 */
'use strict';

const AppActions = require('../actions/AppServerActions');
const BaseAPI = require('./BaseAPI');
const Constants = require('../constants').ActionTypes;

function UserAPIError(error){
    AppActions.handleServerError(error, Constants.USER_SERVER_ERROR);
}

const User = {
    get: () =>{
        BaseAPI.request('/api/users', 'GET').then(response =>{
            if(response.isAuthorized){
                AppActions.receiveUser(response.user);
            }
        }).catch(UserAPIError);
    },
    post: (email) =>{
        const method = 'POST';
        const body = { email: email };

        BaseAPI.request('/api/signup', method, body).then(response =>{
            if(response.success){
                AppActions.handleSignupRequestSent();
            }
        }).catch(UserAPIError);
    }
};
module.exports = User;
