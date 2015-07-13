/**
 * app/flux/App
 */
'use strict';

const React = require('react');
const Router = require('react-router');

const RouteHandler = Router.RouteHandler;

const Footer = require('./components/Footer');
const Header = require('./components/Header');

const UserStore = require('./stores/UserStore');

function getStateFromStores(){
    return { user: UserStore.user };
}

class App extends React.Component {
    constructor(props){
        super(props);

        // Only lifecycle methods receive the inheritance from React.Component.
        this._onChange = this._onChange.bind(this);

        this.state = getStateFromStores();
    }

    componentDidMount(){
        UserStore.addChangeListener(this._onChange);
    }

    componentWillUnmount(){
        UserStore.removeChangeListener(this._onChange);
    }

    render(){
        return (
            <div className="open">
                <Header />
                <RouteHandler
                    params={this.props.params} />
                <Footer />
            </div>);
    }

    _onChange(){
        this.setState(getStateFromStores());
    }
}
App.propTypes = { params: React.PropTypes.object };

module.exports = App;
