var passwordless = require('passwordless');
var app = global.app;
var User = global.db.user;

exports.get = {
  signup: function(req, res){
    res.render('signup');
  }
};

exports.post = {
  signup: passwordless.requestToken(
    // Simply accept every user
    function(email, delivery, callback) {
      User.find({ where: {email: email}})
          .then(function(dbUser){
            if (!dbUser){
              User.create({email: email})
                  .then(function(dbUser){
                    callback(null, dbUser.id);
                  });
            } else {
              callback(null, dbUser.id);
            }
          }, function (err){
            callback(null, null);
          });
  }, {userField: 'email'}) // signup
};

app.route('/signup')
  .get(exports.get.signup)
  .post(exports.post.signup, function(req, res){
    res.render('sent');
  });
