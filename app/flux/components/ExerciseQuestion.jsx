/**
 * app/flux/components/ExerciseQuestion.react
 *
 */
'use strict';

const React = require('react');
const Answer = require('./ExerciseQuestionAnswer');
const ExerciseStore = require('../stores/ExerciseStore');

function getStateFromStores(){
    return { isReview: ExerciseStore.isReview };
}

class ExerciseQuestion extends React.Component{

    constructor(props){
        super(props);

        // Only lifecycle methods receive the inheritance from React.Component.
        this._onChange = this._onChange.bind(this);

        this.state = getStateFromStores();
    }

    componentDidMount(){
        ExerciseStore.addChangeListener(this._onChange);
    }

    componentWillUnmount(){
        ExerciseStore.removeChangeListener(this._onChange);
    }

    render(){
        const isCorrect = this.props.question.result.correct;
        const { question } = this.props;
        const { isReview } = this.state;
        const resultText = isCorrect ? 'Correct' : 'Incorrect';

        const answers = question.answer.values.map(answer =>{
            return (<Answer
                        key = {answer.id}
                        answer = {answer}
                        isSelected = {question.result.chosen === answer.id}
                        questionId = {question.id} />);
        });

        return (
            <li className="exercise-question">
              <span className="question-text">{question.text}</span>
              {isReview &&
                <div className="review-icon">
                  <img src={'/images/answer-' + resultText.toLowerCase() + '.svg'} />
                  <span>{resultText}</span>
                </div>
              }
              <ul className="question-answers">
                  {answers}
              </ul>
              {isReview &&
                <div className="explanation">
                    <h5>But Why?</h5>
                    <p>{question.explanation}</p>
                </div>
              }
            </li>);
    }

    _onChange(){
        this.setState(getStateFromStores());
    }
}

ExerciseQuestion.propTypes = {
  question: React.PropTypes.object
};

module.exports = ExerciseQuestion;
