/**
 * trainify/backend/plugins/logger.js
 */
'use strict';

var morgan = require('morgan');
module.exports = function AttachLogger(app){
    if (process.env.NODE_ENV === 'development'){
        app.use(morgan('short'));
    }
};
