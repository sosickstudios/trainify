/**
 * app/flux/API/StoreAPI
 *
 */
'use strict';

const BaseAPI = require('./BaseAPI');

const Store = {
    get: {
        store: () =>{
            return BaseAPI.request('/api/store', 'GET');
        },
        checkout: (trainingId) =>{
            if(!trainingId){
                return Promise.reject(new Error('Invalid Training Id'));
            }

            return BaseAPI.request('/api/buy/' + trainingId, 'GET');
        }
    }
};

module.exports = Store;
