/**
 * app/flux/components/Exercise.react
 *
 */
'use strict';

// Library Dependencies
const cx = require('classnames');
const React = require('react');

// API Access
const ExerciseAPI = require('./../API/ExerciseAPI');

// Components
const ExerciseQuestion = require('./ExerciseQuestion');
const Headroom = require('react-headroom');

// Store Dependencies
const ExerciseStore = require('../stores/ExerciseStore');

/**
 * Retrieve all state variables from their respected stores.
 *
 * @returns {Object} State data to return.
 */
function getStateFromStores(){
    return {
        category: ExerciseStore.category,
        exercise: ExerciseStore.exercise,
        isReview: ExerciseStore.isReview,
        progress: ExerciseStore.percentAnswered(),
        questions: ExerciseStore.questions,
        training: ExerciseStore.training
    };
}

/**
 * React Class representing the Exercise view component.
 *
 */
class Exercise extends React.Component {
    constructor(props){
        super(props);

        // Only lifecycle methods receive the inheritance from React.Component.
        this._onChange = this._onChange.bind(this);

        this.state = getStateFromStores();
    }

    componentDidMount(){
        var {category, total, trainingId, tree, type} = this.context.router.getCurrentQuery();

        ExerciseStore.addChangeListener(this._onChange);
        ExerciseAPI.get.exercise(category, total, trainingId, tree, type).then(data =>{

            // Need to initialize data store.
            ExerciseStore.init(data.category, data.exercise, data.questions, data.training);
        });
    }

    componentWillUnmount(){
        ExerciseStore.removeChangeListener(this._onChange);
    }

    render(){
        // Retrieve all state variables.
        let { category, isReview, progress, questions, training } = this.state;

        // Some strings for when the exercise is in review.
        const cautionText = 'We can do better! Don\'t be discouraged by your score!';
        const failText = 'Not satisfied with your score? Don\'t Panic! Stay the course!';
        const passText = 'Good Start! Remember to keep in mind there is still work to be done.';

        let answeredCorrect;
        let contextClass;
        let contextText;
        let score;
        if (isReview){
            answeredCorrect = ExerciseStore.answeredCorrect;
            score = ExerciseStore.score;

            if (score >= 80){
                contextClass = 'passing';
                contextText = passText;
            } else if (score >= 50){
                contextClass = 'caution';
                contextText = cautionText;
            } else{
                contextText = failText;
                contextClass = 'failing';
            }
        }

        const componentQuestions = questions.map(question =>{
            return (<ExerciseQuestion
                key={question.id}
                question={question} />);
        });

        return (
            <div>
                <Headroom disableInlineStyles = {true}>
                    <div className="exercise-status">
                        <div className="start-over">
                            <button onClick={this._locationReload}>Start Over</button>
                        </div>
                        <h2>{category ? category.name : training.name}</h2>
                        <div className="progress">
                            <svg className="progress-meter"
                                version="1.1"
                                x="0px" y="0px"
                                xmlns="http://www.w3.org/2000/svg">
                                <path id='p'
                                    style={{strokeDashoffset: progress ? (100 - progress) / 100 * -250 : '-260'}}
                                    d="M45,4C22.392,4,4,22.393,4,45c0,22.608,18.392,41,41,41s41-18.392,41-41S67.608,4,45,4z"
                                    fill="none"
                                    strokeDasharray="282, 282"
                                    strokeWidth="8">
                                </path>
                                <text id='progress-percent' x="9" y="21">
                                    {progress.toFixed() + '%'}
                                </text>
                            </svg>
                        </div>
                        <div className="exercise-overview">
                            <a href="/">Go back to dashboard</a>
                        </div>
                    </div>
                </Headroom>

                <main className="exercise">
                    <div className={cx({review: isReview}, {hidden: !isReview})}>
                        <div className="help-text">
                            <span>Results</span>
                            <p className="results-text">{contextText}</p>
                        </div>

                    <div className="score">
                        <span className="score-percent">{score + '%'}</span>
                        <svg className={'score-meter ' + contextClass} version="1.1" x="0px" y="0px">
                            <path id='p-score' fill="none"
                                  style={{strokeDashoffset: (100 - score) / 100 * -250}}
                                  strokeDasharray="282 282"
                                  strokeWidth="8"
                                  d="M45,4C22.392,4,4,22.393,4,45c0,22.608,18.392,41,41,41s41-18.392,41-41S67.608,4,45,4z"></path>
                         </svg>
                         <h5>SCORE</h5>
                         <div className="ratio">
                             <span className="correct">{answeredCorrect + '/' + questions.length}</span><br/>
                             ANSWERED CORRECTLY
                         </div>
                    </div>
                </div>

                <ul className="exercise-questions">
                  {componentQuestions}
                </ul>

                <p className="legal">{training.legal}</p>
        </main>
      </div>);
    }

    _locationReload(){
        location.reload();
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

Exercise.contextTypes = {
  router: React.PropTypes.func
};

module.exports = Exercise;
