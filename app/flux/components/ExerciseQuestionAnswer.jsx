/**
 * app/flux/components/ExerciseQuestionAnswer.react
 *
 */
'use strict';

const cx = require('classnames');
const React = require('react');
const Actions = require('./../actions/ExerciseActionCreators');
const ExerciseStore = require('../stores/ExerciseStore');

function getStateFromStores(){
    return { isReview: ExerciseStore.isReview };
}

class Answer extends React.Component {

    constructor(props){
        super(props);

        // Only lifecycle methods receive the inheritance from React.Component.
        this._onChange = this._onChange.bind(this);
        this._onClick = this._onClick.bind(this);

        this.state = getStateFromStores();
    }

    componentDidMount(){
        ExerciseStore.addChangeListener(this._onChange);
    }

    componentWillUnmount(){
        ExerciseStore.removeChangeListener(this._onChange);
    }

    render(){
        const { answer, isSelected } = this.props;
        const { isCorrect } = answer;
        const { isReview } = this.state;

        let correctness;
        if (isCorrect){
            correctness = 'correct';
        } else if(isSelected && !isCorrect){
            correctness = 'incorrect';
        }

        return (
            <li className={cx({'question-answer': true},
                            {'question-answer-review': isReview},
                            {'selection': isSelected},
                            {'correct': isCorrect},
                            {'incorrect': !isCorrect && isSelected})}
                onClick={this._onClick}>
                {isReview && (isSelected || isCorrect) &&
                    <div>
                        { isSelected && <span className='selection-text'>'You Selected'</span> }
                        <img src={'images/icon-' + correctness + '.svg'} />
                    </div>
                }
                <p className="answer-text">{answer.text}</p>
            </li>
        );
    }

    _onClick(){
        const {answer, questionId} = this.props;
        if(!this.state.isReview){
            Actions.clickAnswer(questionId, answer);
        }
    }

    _onChange(){
        this.setState(getStateFromStores());
    }
}

Answer.propTypes = {
  answer: React.PropTypes.object.isRequired,
  questionId: React.PropTypes.number.isRequired
};

module.exports = Answer;
