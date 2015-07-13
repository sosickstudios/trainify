/**
 * app/flux/components/TrainifyIndex.react
 *
 */
'use strict';

const React = require('react');
const { Link } = require('react-router');

class TrainifyIndex extends React.Component {

    render(){
        return (
        <main className="home">
            <section className="promo">
                <h3>Meet Trainify</h3>
                <img src="images/ipad-vertical.png" width="450" />
                <p>A dynamic education platform that tailors each exercise directly to you, elimating the guesswork from learning new content.</p>
                <Link to="store" className="btn--courses">View Courses</Link>
            </section>
            <hr/>
            <section className="features container">
                <div className="feature g--third">
                    <img src="images/overview-1.png" height="175" />
                    <h5>Performance-Based Analytics</h5>
                    Trainify provides focused feedback & advanced analytics to help you easily conceptualize areas of mastery and weakness. This allows you to pinpoint exactly which areas of study require the most emphasis and allocate study time accordingly.
                </div>
                <div className="feature g--third">
                    <img src="images/mobile-1.png" height="175" />
                    <h5>Mobile Friendly Platform</h5>
                    The world is moving fast and with our platform there is no slowing down. Trainify is fully compatible in a mobile friendly setting. Wherever you are, we have you covered.
                </div>
                <div className="feature g--third">
                    <img src="images/ipad-vertical.png" height="175" />
                    <h5>Top-Quality Content</h5>
                    We pride ourselves in having content that most closely matches the questions you will see on exam day. Our question banks are developed by industry practitioners with years of experience teaching their respective certifications. Content is promptly updated to match any curriculum changes.
                </div>
            </section>
        </main>);
    }
}

module.exports = TrainifyIndex;
