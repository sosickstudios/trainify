(function(){

    var header = document.querySelector('.exercise-status');
    var headroom = new Headroom(header);
    headroom.init();

    /**
     * Prototypes representation of each question in an exercise.
     *
     * @param {Element.<li>} question The element that has been queried which contains
     *                                the question.
     * @param {Number} number What number the question falls in the exercise.
     * @param {Exercise} exercise The exercise that the question belongs to.
     */
    function Question (question, exercise){

        // The question itself. /=> Element.<li>
        this.content = question;

        // The exercise this question belongs to.
        this.parent = exercise;

        // The database id of this question.
        this.id = question.dataset.questionId;

        // The list of answers /=> Array.<Element.<li>>
        this.answers = question.querySelectorAll('.question-answers li');

        this.result = {
            // If we have already sent an update request, this will store the result id.
            id: null,

            // If the user has selected an answer.
            chosen: null,

            // If there has been an update request, and there was a result received.
            correct: null
        };

        this.review = false;

        /**
         * If we send off an update request for a Question we can put together the request here.
         *
         * @return {Object} This will return an object in the format of a result.
         */
        this.getRequest = function(){
            return {
                id: this.result.id,
                exerciseId: this.parent.id,
                questionId: this.id,
                chosen: this.result.chosen
            };
        }.bind(this);

        /**
         * When we receive a response from an XMLHttpRequest for the question, we can simply use  * this setter to update all class values.
         *
         * @param {XMLHttpRequest.<response>} response This is our response from the backend on an *                                             update.
         */
        this.setRequest = function(response){
            response = JSON.parse(response);
            this.result.id = response.id;
            this.result.correct = response.result;
        }.bind(this);

        question.querySelector('.question-answers').addEventListener('click', function (e){
            if (!this.review && e.target.tagName.toLowerCase() !== 'ul'){
                var target = e.target.tagName.toLowerCase() === 'li' ? e.target : e.target.parentNode;
                this.selectAnswer(target);
                this.sendUpdateRequest();
            }

        }.bind(this));
    }

    /**
     * The question answer list has been clicked on, we should go through our answers
     * and reflect the selection.
     *
     * @param {Element.<li>} answer The list item that has been clicked on.
     */
    Question.prototype.selectAnswer = function (answer){
        // Set the current chosen answer to the answer id.
        this.result.chosen = answer.dataset.answerId;
        this.result.correct = answer.dataset.isCorrect;

        for (var i = 0; i < this.answers.length; i++){
            var item = this.answers[i];

            // Highlight the selected answer.
            if (item.dataset.answerId === this.result.chosen){
                item.classList.add('selection');
            } else {
                item.classList.remove('selection');
            }
        }

        // Set the flag that the question has been answered at least once.
        this.content.dataset.questionAnswered = true;
    };

    /**
     * Is this question answered yet.
     *
     * @return {Boolean}
     */
    Question.prototype.isAnswered = function (){
        return this.result.chosen !== null;
    };

    /**
     * Was this question answered correct.
     *
     * @return {Boolean}
     */
    Question.prototype.isCorrect = function (){
        return this.result.correct; 
    };

    /**
     * When a user clicks on an answer, this will update the question and give it a result.
     *
     * URL: /exercise
     * Method: PUT
     * Body Expectations: Result Model
     */
    Question.prototype.sendUpdateRequest = function (){
        var request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if(request.readyState === 4 && request.status === 200){
                this.parent.onQuestionAnswered();
            }
        }.bind(this);

        request.open('PUT', '/exercise/question/' + this.id, true);
        request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        request.send(JSON.stringify(this.getRequest()));
    };

    /**
     * Transform the question to review mode by adding contextual classes to display the correctness
     * of the question.
     * 
     */
    Question.prototype.setReview = function (){
        // Disable selecting answers
        this.review = true;

        // Load icon based on whether user answered question correctly.
        var questionResult = this.result.correct ? 'Correct' : 'Incorrect';
        var resultText = questionResult.toLowerCase();

        // Reference node to insert icon after.
        var questionAnswers = this.content.querySelector('.question-answers');

        // container that holds icon and text.
        // var container = document.createElement('div');
        var container = this.content.querySelector('.question-review .review-icon');
        var reviewIcon = document.createElement('img');
        var textNode = document.createElement('span');

        container.classList.add('review-icon');
        container.classList.add(resultText);
        reviewIcon.setAttribute('src', '/images/answer-' + resultText + '.svg');
        textNode.textContent = questionResult;

        // img and span element inside div container.
        container.appendChild(reviewIcon);
        container.appendChild(textNode);

        // // Inject the element that we created.
        // this.content.insertBefore(container, questionAnswers);

        // Add styling to answers for correctness.
        for(var i = 0; i < this.answers.length; i++){
            var answer = this.answers[i];

            var isCorrect = answer.dataset.isCorrect;
            var isSelected = answer.dataset.answerId.toString() === this.result.chosen.toString();

            // set the src of the img element
            var answerIcon = document.createElement('img');
            var correctness = '';
            var imagePath = 'images/icon-';
            if (isCorrect){
                correctness = 'correct';
            } else if (isSelected && !isCorrect){
                correctness = 'incorrect';
            }

            // show the explanation for the selected and correct answer.
            if (isCorrect || isSelected){
                answerIcon.setAttribute('src', imagePath + correctness + '.svg');
                answer.classList.add('question-answer-review');
                answer.classList.add(correctness);

                // query element as reference to insert new element.
                var answerText = answer.querySelector('.answer-text');
                answer.insertBefore(answerIcon, answerText);

                // Add 'selected' label for chosen answer.
                if (isSelected){
                    var selectionText = document.createElement('span');
                    selectionText.textContent = 'You Selected';
                    selectionText.classList.add('selection-text');

                    answer.insertBefore(selectionText, answerIcon);
                }
            }
        }

        // Show the explanation.
        this.content.querySelector('.question-review').classList.remove('hidden');
    };

    /**
     * Prototyped description of the exercise being taken.
     *
     * @param {Element.<div>} content Element containing the exercise.
     * @param {Number} id The db id of the exercise being taken.
     */
    function Exercise (content, id) {
        this.content = content;
        this.complete = false;
        this.id = id;

        // Array of question elements. /=> Array.<Element.<li>>
        this.questions = [];

        // Questions in the exercise /=> NodeList.<Element.<li>>
        var questionsList = this.content.querySelectorAll('.exercise-question');

        // Add each question to our array of questions.
        for (var i = 0; i < questionsList.length; i++){
            this.addQuestion(questionsList.item(i));
        }
    }

    /**
     * Add a question to the array of questions that we are in posession of.
     *
     * @param {Element.<li>} content The list item element that represents the question.
     * @param {Number} number The number that this question is on the exercise.
     */
    Exercise.prototype.addQuestion = function(content, number){
        var question = new Question(content, this);
        this.questions.push(question);
    };

    Exercise.prototype.questionCount = function(){
        return this.questions.length;
    };

    /**
     * Called when all questions in the exercise are believed to be completed. Triggers all
     * questions to review mode and shows review box at the top of the exercise.
     *
     */
    Exercise.prototype.review = function (){
        // TODO(Bryce) Would be nice if these could be loaded from the server so they can change.
        var cautionText = 'We can do better! Don\'t be discouraged by your score!';
        var failText = 'Not satisfied with your score? Don\'t Panic! Stay the course!';
        var passText = 'Good Start! Remember to keep in mind there is still work to be done.';
        
        // Must be set for scoring to be done!!
        this.complete = true;

        // Show the review box.
        this.content.querySelector('.review').classList.remove('hidden');

        // Score the exercise
        var scoreBox = this.score();
        var percent = scoreBox.percentage;
        var score = (100 - percent) / 100 * -250;

        // Retrieve the svg path for updating stroke offset.
        document.getElementById('p-score').setAttribute('stroke-dashoffset', score);
            
        // Retrieve all elements for the review box that need content change.
        var progressPath = this.content.querySelector('.score-meter');
        var ratioCorrect = this.content.querySelector('.ratio .correct');
        var resultsText = this.content.querySelector('.help-text .results-text');
        var scoreText = this.content.querySelector('.score-percent');

        // Find out which context to apply to our svg.
        var contextClass;
        var contextText;
        if (percent > 80){
            contextClass = 'passing';
            contextText = passText;
        } else if (percent < 80 && percent > 65){
            contextClass = 'caution';
            contextText = cautionText;
        } else {
            contextText = failText;
            contextClass = 'failing';
        }
        scoreText.classList.add(contextClass);
        progressPath.classList.add(contextClass);

        // Change the content of the elements.
        ratioCorrect.textContent = scoreBox.correct + ' / ' + scoreBox.total;
        resultsText.textContent = contextText;
        scoreText.textContent = percent.toFixed() + '%';

        // Trigger all questions for review.
        for(var i = 0; i < this.questions.length; i++){
            this.questions[i].setReview();
        }
    };

    /**
     * Check to see if all questions in the exercise are answered. If all
     * questions are answered, an update request to the exercise model should
     * be sent to score the exercise.
     *
     */
    Exercise.prototype.onQuestionAnswered = function(){
        var hasEmptyQuestion = false;
        var totalAnswered = 0;

        for(var i = 0; i < this.questions.length; i++){
            if(!this.questions[i].isAnswered()) {
                hasEmptyQuestion = true;
            } else {
                totalAnswered++;
            }
        }

        var percent = totalAnswered / this.questions.length * 100;
        var progress = (100 - percent) / 100 * -250;
        document.getElementById('p').setAttribute('stroke-dashoffset', progress);
        document.querySelector('.progress-percent').textContent = percent.toFixed() + '%';

        if (!hasEmptyQuestion){
            headroom.destroy();
            header.classList.add('headroom');
            header.classList.add('headroom--pinned');
            header.classList.add('completed');
            // Send an update request to score the exercise;
            this.sendUpdateRequest();
        }
    };

    /**
     * Send update request for exercise, in order to score the exercise and receive a score.
     *
     */
    Exercise.prototype.sendUpdateRequest = function(){
        var request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if(request.readyState === 4 && request.status === 200){
                this.review();
            }
        }.bind(this);

        request.open('PUT', '/exercise', true);
        request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        request.send(JSON.stringify({id: this.id}));
    };

    /**
     * Score the exercise if it is complete.
     *
     * @return {Object.<Number, Number, Number, Number>}
     */
    Exercise.prototype.score = function(){
        if(!this.complete) return {};

        // Find the score for the exercise
        var correctCount = 0;
        var total = this.questions.length;
        for(var i = 0; i < this.questions.length; i++){
            if(this.questions[i].isCorrect()){
                correctCount++;
            }
        }
        
        return {
            percentage: Math.round((correctCount / this.questions.length).toFixed(2) * 100),
            correct: correctCount,
            incorrect: (this.questions.length - correctCount),
            total: this.questions.length
        };
    };

    var querySelector = document.querySelector.bind(document);

    var exercise;
    function init (){
        var content = querySelector('.exercise');
        var exerciseId = content.dataset.exerciseId;

        exercise = new Exercise(content, exerciseId);

        document.querySelector('.start-over button').addEventListener('click', function(){
           location.reload();
        });
    }
    init();
}());