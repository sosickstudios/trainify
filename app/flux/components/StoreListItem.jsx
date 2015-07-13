/**
 * app/flux/components/StoreListItem.react
 *
 */
'use strict';

const React = require('react');

class StoreListItem extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        const { course } = this.props;

        return (
            <li className="clear">
                <div className="name--course">
                    <h4>{course.name + ' '}
                    {course.hasPurchased ?
                        <span className="purchased">Purchased</span> :
                        <a href={'#/buy/' + course.id} className="btn--buy">Purchase</a>
                    }
                    </h4>
                    { course.hasPurchased &&
                        <a href={'#/dash/' + course.name} className="btn--access">Access your course</a>
                    }
                </div>
                <div className="summary--course">
                    <div className="description--course g--half">
                        <p>PMI’s Project Management Professional (PMP)® credential is the most important industry-recognized certification for project managers. Globally recognized and demanded, the PMP® demonstrates that you have the experience, education and competency to lead and direct projects.</p>
                        <p>Trainify’s PMP® Preparation is a state of the art dynamic platform that tailors each exercise to the student based on previous performance. The Trainify SmartGEN system constantly adapts to help the student overcome problem areas that come to light through practice. The Trainify system takes the guessing work away from the student, leaving them with a comfortable environment that helps achieve mastery in any subject.</p>
                        { course.isAdmin &&
                            <div className="admin">
                                <a href="/reloadcourse/id" target="_blank">Reload Course</a>
                                <a href="/updatecourse/id">Syncronize course</a>
                                <a href="/editcourse/id" target="_blank">Edit course on Google Docs</a>
                            </div>
                        }
                    </div>
                    <ul className="outline g--half">
                        <li>5 PMBOK Process Groups</li>
                        <li>10 PMBOK Knowledge Areas</li>
                        <li>Chapters 1-13 PMBOK 5th Edition</li>
                        <li>Mock Exam Preparation</li>
                        <li>350+ Test Bank Questions</li>
                        <li>Trainify SmartGEN System</li>
                        <li>Mobile Friendly</li>
                        <li>60 Days Unlimited Access</li>
                    </ul>
                </div>
            </li>
        );
    }
}

StoreListItem.propTypes = {
  course: React.PropTypes.object
};

module.exports = StoreListItem;
