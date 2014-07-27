/**
 * Returns a function that can be passed to express to handle a request and render
 * the response with the specified template.
 *
 * @param  {String}   name The name of the template to render.
 * @return {Function}      The handler used by express.
 */
module.exports.render = function render(name){
  return (function(templateName){
    return function(req, res){
      res.render(templateName);
    };
  }(name));
};

/**
 * Returns a function that will redirect the user to the specified path.
 *
 * @param  {String}   name The location to redirect to.
 * @return {Function}      The handler used by express.
 */
module.exports.redirect = function redirect(name){
  return (function(templateName){
    return function(req, res){
      res.redirect(templateName);
    };
  }(name));
};