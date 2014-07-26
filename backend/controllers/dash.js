/**
 * Dash controller for express.js GET route /dash. Should render the 
 * dash.hbs with all proper data required for the user.
 * @param  { Object }   req   express.js request object]
 * @param  { Object }   res   express.js response object ]
 * @param  { Function } next  express.js callback 
 * @return {[ type]}        [description]
 */
var app = global.app;

var mockTraining = {
	description: 'This is the description of the training course',
	category: {
		name: 'ROOT Category', 
		children: [{
			name: 'Child 1',
			children: [{
				name: 'Child2'
			}]
		}, {
			name: 'Child 3'
		}]
	},  
	company: {
		name: 'Company Name', 
		bio: 'Company Bio'
	}
};

exports.get = {
  dash: function(req, res, next){

    res.render('dash', {
    	training: mockTraining
    });
  }
};

exports.post = {
  dash: function (req, res){

  }
};

app.route('/dash')
  .get(exports.get.dash)
  .post(exports.post.dash);


//Courses
//Course Provider
//Expiration Date
//Structure of categories
function getDashData (req, res, next){

}