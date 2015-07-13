/**
 * app/flux/API/BaseAPI.js
 */
'use strict';

/**
 * Provide Base abstraction for fetch requests.
 *
 */
const BaseAPI = {
    request: (url, method, body) =>{
        const options = {
            method: method,
            body: JSON.stringify(body),
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            }
        };

        return fetch(url, options).then(response =>{
            return response.json();
        }).catch(e =>{
            return Promise.reject(e);
        });
    }
};

module.exports = BaseAPI;
