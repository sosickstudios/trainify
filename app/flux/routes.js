/**
 * trainify/app/flux/components
 */
'use strict';

var App = require('./App');
var CheckoutView = require('./components/Checkout');
var DashView = require('./components/Dash');
var ExerciseView = require('./components/Exercise');
var SignupView = require('./components/Signup');
var StoreView = require('./components/Store');
var TrainifyIndex = require('./components/TrainifyIndex');

var React = require('react');
var Router = require('react-router');

var {DefaultRoute, Route} = Router;

var routes = (
  <Route name="trainify" path="/" handler={App}>
    <Route
      name="buy"
      path="/buy/:id"
      handler={CheckoutView} />
    <Route
      name="dash"
      path="/dash/:course"
      handler={DashView} />
    <Route
      name="exercise"
      path="/exercise"
      handler={ExerciseView} />
    <Route
      name="store"
      path="/store"
      handler={StoreView} />
    <Route
      name="signup"
      path="/signup"
      handler={SignupView} />
    <DefaultRoute
      name="home"
      handler={TrainifyIndex} />
  </Route>
);

module.exports = routes;
