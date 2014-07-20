var passwordless = require('passwordless');

var app = global.app;

app.get('/signup', function(req, res){
    res.render('signup');
});

// Use this special syntax to specify a flow of requests.
app.post('/signup',
  passwordless.requestToken(
    // Simply accept every user
    function(user, delivery, callback) {
      console.log('signup for %s', user);

      global.plugins.db.user.find({ where: {email: user}})
          .then(function(dbUser){
            if (!dbUser){
              global.plugins.db.user.create({email: user, name: 'Sample'})
                  .then(function(dbUser){
                    console.log('Got user with id of %s', dbUser.id);
                    callback(null, dbUser.id);
                  });
            } else {
              callback(null, dbUser.id);
            }
          }, function (err){
            console.log(err);
            callback(null, null);
          });
    }, {userField: 'email'}),
  function(req, res) {
      res.render('sent');
});
