/**
 * app/flux/lib/router
 */
'use strict';

let router;
module.exports = {
    makePath(to, params, query){
        return router.makePath(to, params, query);
    },

    makeHref(to, params, query){
        return router.makeHref(to, params, query);
    },

    transitionTo(to, params, query){
        router.transitionTo(to, params, query);
    },

    replaceWith(to, params, query){
        router.replaceWith(to, params, query);
    },

    goBack(){
        router.goBack();
    },

    run(render){
        router.run(render);
    }
};

const routes = require('./../routes');
const Router = require('react-router');

router = Router.create({
  routes: routes
  // location: Router.HistoryLocation
});
