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
	name: 'Project Management Professional',
	description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
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
		name: 'Global Project Management LLC.', 
		bio: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.'
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