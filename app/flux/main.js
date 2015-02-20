/**
 * app/flux/main.js
 */
'use strict';

// ES6 Fetch
require('whatwg-fetch');

const router = require('./lib/router');
const React = require('react');
const UserAPI = require('./API/UserAPI');

UserAPI.get();

window.React = React;

router.run((Handler, state) =>{
    React.render(<Handler params={state.params} />, document.getElementById('application'));
});
