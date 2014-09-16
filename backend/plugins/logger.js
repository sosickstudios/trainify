var morgan = require('morgan');

module.exports = function attachLogger(app){
    if (process.env.NODE_ENV === 'development'){
        app.use(morgan('short'));
    }
}