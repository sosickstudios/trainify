/**
 * trainify/test/startup.js
 */
'use strict';

afterEach(function (done){
    global.app.locals.user = null;
    done();
});

beforeEach(function(done){
    global.app = require('./../backend').run();

    // We shouldn't need this here, but just as a safety precaution...
    if (process.env.NODE_ENV === 'testing' || true){
        var sequelize = require('../backend/plugins/db');

        sequelize.sync({force: true}).then(function(){
            var importer = require('./../import');

            return importer.all();
        }).then(done)
        .catch(done);

        return;
    } else{
        done();
    }
});
