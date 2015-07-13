/**
 * app/flux/components/Dash.react
 */
'use strict';

// Components
const CategoryListItem = require('./CategoryListItem');
const StarBurst = require('./StarBurst');

// API
const DashAPI = require('../API/DashAPI');

// Store Dependencies
const DashStore = require('../stores/DashStore');
const UserStore = require('../stores/UserStore');

// Library Dependencies
const React = require('react');
const { Link } = require('react-router');

/**
 * Retrieve all state variables from their respected stores.
 *
 * @returns {Object} State object to be returned
 */
function getStateFromStores(){
    return {
        categories: DashStore.categories,
        isEmpty: DashStore.isEmpty,
        stats: DashStore.stats,
        training: DashStore.training,
        user: UserStore.user
    };
}

/**
 * React Class representing the Dash view component.
 *
 */
class DashSection extends React.Component {
    constructor(props){
        super(props);

        // Only lifecycle methods receive the inheritance from React.Component.
        this._onChange = this._onChange.bind(this);

        this.state = getStateFromStores();
    }

    componentDidMount(){
        const { course } = this.context.router.getCurrentParams();

        DashStore.addChangeListener(this._onChange);

        // Make the network call for the data in dash, initialize Dash Store
        DashAPI.get.course(course);
    }

    componentWillUnmount(){
        DashStore.removeChangeListener(this._onChange);
    }

    render(){
        let { isEmpty } = this.state;

        if (isEmpty){
            return null;
        }

        const {categories, stats, training} = this.state;
        const generalStats = stats.general;
        const trees = stats.trees;

        // Create our List Items that will present the categories.
        const categoryList = categories.map(category =>{
            return (<CategoryListItem
                key = {category.id}
                category = {category}
                trainingId = {training.id} />);
        }, this);

        return (
            <main className="dash">
                <ul className="dash-stats">
                    <li className="exam-passcount">
                        <span className="dash-text">{generalStats.passCount}</span>
                        <span className="dash-explanation">Tests Passed</span>
                    </li>
                    <li className="exam-failcount">
                        <span className="dash-text">{generalStats.failCount}</span>
                        <span className="dash-explanation">Tests Failed</span>
                    </li>
                    <li className="exam-average">
                        <span className="dash-text">{generalStats.examAverage ? generalStats.examAverage : 'N/A'}</span>
                        <span className="dash-explanation">Test Average</span>
                    </li>
                </ul>

                <div className="dash-overview clear g--wide-full">
                    <Link to="exercise"
                        query={{trainingId: training.id,
                            tree: 'matrix',
                            type: 'Exam Prep'}}
                            className="btn-orange btn--full-exam">Take Full Exam
                    </Link>
                    <StarBurst
                    stats = {trees}
                    training = {training} />
                    <div className="grid-course-description">
                        <p className="course-description">
                            {training.description}
                        </p>
                        <ul>
                            {categoryList}
                        </ul>
                    </div>
                </div>
      </main>
    );
    }

  /**
   * If one of the data stores emits a change, this callback is used to retrieve the new data for
   * this component.
   * @returns {undefined} No Payload Data Provided.
   */
    _onChange(){
        this.setState(getStateFromStores());
    }
}

DashSection.propTypes = {
  course: React.PropTypes.string
};

DashSection.contextTypes = {
  router: React.PropTypes.func
};

module.exports = DashSection;
