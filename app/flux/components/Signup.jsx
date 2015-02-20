/**
 * app/flux/components/Signup.react
 *
 */
'use strict';

const Actions = require('./../actions/AppViewActions');
const React = require('react');
const UserStore = require('../stores/UserStore');

function getStateFromStores(){
    return { signupPending: UserStore.signupPending };
}

class Signup extends React.Component {
    constructor (props){
        super(props);

        this.state = getStateFromStores();

        // Only lifecycle methods receive the inheritance from React.Component.
        this._onSubmit = this._onSubmit.bind(this);
        this._onChange = this._onChange.bind(this);
    }

    componentDidMount (){
        UserStore.addChangeListener(this._onChange);
    }

    componentWillUnmount (){
        UserStore.removeChangeListener(this._onChange);
    }

    render (){
        const { signupPending } = this.state;

        return (
            <main className="signup">
                {!signupPending ?
                    <div>
                        <h2>Ready to join or coming back? <br />Great! Just enter your email address.</h2>

                        <form onSubmit={this._onSubmit}>
                            <label>
                              <span>e-mail address</span>
                              <div>
                                <input type="email" name="email" ref="email" required autofocus autoCorrect="off" autoCapitalize="off" />
                                <input type="submit" value="" />
                              </div>
                            </label>
                        </form>
                    </div> :
                    <div>
                        <h1>Almost done!</h1>
                        <p>
                            We just sent you an email, click on the link in that email to login.
                        </p>
                    </div>
                }
            </main>);
    }

    _onChange (){
        this.setState(getStateFromStores());
    }

    _onSubmit (event){
        event.preventDefault();

        const email = React.findDOMNode(this.refs.email).value.trim();
        Actions.clickUserSignup(email);
    }
}

module.exports = Signup;
