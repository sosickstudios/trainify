/**
 * app/flux/components/Header.react
 *
 */
'use strict';

const cx = require('classnames');
const React = require('react');
const { Link } = require('react-router');

const AppActions = require('../actions/AppViewActions');
const AppStore = require('../stores/AppStore');
const UserStore = require('../stores/UserStore');

/**
 * Retrieve all state variables from their respected stores.
 *
 * @returns {Object} State data to be returned.
 */
function getStateFromStores(){
    return {
        navDrawerOpen: AppStore.navDrawerOpen,
        user: UserStore.user
    };
}

/**
 * React Class representing the Header view component.
 *
 */
class Header extends React.Component {

    constructor(props){
        super(props);

        // Only lifecycle methods receive the inheritance from React.Component.
        this._onChange = this._onChange.bind(this);
        this._onMenuClick = this._onMenuClick.bind(this);

        this.state = getStateFromStores();
    }

    componentDidMount(){
        AppStore.addChangeListener(this._onChange);
        UserStore.addChangeListener(this._onChange);
    }

    componentWillUnmount(){
        AppStore.removeChangeListener(this._onChange);
        UserStore.removeChangeListener(this._onChange);
    }

    render (){
        const { navDrawerOpen, user } = this.state;

        const loggedIn = !!user;
        const loginLink = loggedIn ? '/api/logout' : '/#/signup';

        return (<div>
            <header className={cx('app-bar', 'promote-layer', {open: navDrawerOpen})}>
                <div className="app-bar-container">
                    <button className="menu" onClick={this._onMenuClick}>
                        <img src="/images/hamburger.svg" width="24" height="24" alt="Menu"/>
                    </button>
                    <h1 className="logo"></h1>
                    <section className="app-bar-actions">
                        <a href={loginLink} className={cx('app-bar-user', {'signed-in': loggedIn})}>
                            <img className="app-bar-user" src="/images/user.svg" width="26" height="26" />
                            <span>{loggedIn ? user.email : 'Login Or Signup'}</span>
                        </a>
                    </section>
                </div>
                <div className="logo-container">
                    <h1 className="logo">
                        <a href="/"><img src="/images/logo.svg" alt="Trainify" width="166" height="77" /></a>
                    </h1>
                </div>
            </header>

            <nav className={cx('navdrawer-container', 'promote-layer', {open: navDrawerOpen})}>
                <h4>Navigation</h4>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/#/store">Store</a></li>
                    {loggedIn && <li>
                        <Link to="dash" params={{course: 'Trainify-PMP%C2%AE-Preparation'}}>
                            Trainify-PMP® Preparation</Link></li>}
                    <li><a href={loginLink}>{loggedIn ? 'Logout' : 'Login'}</a></li>
                </ul>
            </nav>
      </div>);
    }

    _onChange(){
        this.setState(getStateFromStores());
    }

    /**
    * The navigation drawer menu button has been clicked.
    * @returns {undefined} No Payload Data Provided.
    */
    _onMenuClick(){
        // Call the proper action creator for emitting the event.
        AppActions.clickNavigationMenu();
    }
}

module.exports = Header;
