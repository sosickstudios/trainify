/**
 * app/flux/components/Store.react
 *
 */
'use strict';

const React = require('react');
const StoreAPI = require('../API/StoreAPI');
const StoreListItem = require('./StoreListItem');

class StoreSection extends React.Component {

    constructor(props){
        super(props);

        this.state = { courses: [] };
    }

    componentDidMount(){
        StoreAPI.get.store().then(response =>{

            // No data store for the Store as of right now.
            this.setState({courses: response.courses});
        });
    }

    render(){
        const { courses } = this.state;
        const courseList = courses.map(course =>{
            return (<StoreListItem
                        key = {course.id}
                        course = {course} />);
        });

        return (<main className="store">
            <section className="help--store">
                <h3>Purchase Course Access</h3>
                <p>Trainify s current offering of courses is listed below for purchase. If you have any questions or have problems purchasing access, please contact <a href="mailto:support@trainify.io">support@trainify.io</a> and our team will be sure to be in touch with you shortly.</p>
            </section>
            <hr/>
            <ul className="courses--store">
                {courseList}
            </ul>
        </main>);
    }
}

module.exports = StoreSection;
