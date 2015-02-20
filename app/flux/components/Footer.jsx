/**
 * app/flux/components/Footer.react
 */
'use strict';

const React = require('react');

class Footer extends React.Component{
    render (){
        return (<footer>
            <div className="social">
                <img className="footer-logo" src="/images/footer-logo.svg" />
                <div className="external">
                    <img src="/images/facebook.svg" />
                    <img src="/images/twitter.svg" />
                </div>
            </div>
            <div className="site-links">
                <div className="legal">&copy; 2014
                    <a href="/terms.html">Terms &amp; Conditions</a>
                    <a href="/privacy.html">Privacy Policy</a>
                </div>
                <div className="sitewide">
                    <ul className="footer-solutions">
                        <li className="title">Solutions</li>
                        <li><a href="mailto:support@trainify.io">Get in touch</a></li>
                    </ul>
                </div>
            </div>
        </footer>);
    }
}
module.exports = Footer;
