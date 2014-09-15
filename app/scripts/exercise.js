(function (){

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
            if (!this.review){
                this.selectAnswer(e.target.parentNode);
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
            item.classList.toggle('answer-selected', item.dataset.answerId === this.result.chosen);
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
        return this.content.dataset.questionResult instanceof Boolean && this.content.dataset.questionResult;
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

    Question.prototype.setReview = function (){
        // Disable selecting answers
        this.review = true;

        // Load icon based on whether user answered question correctly.
        var questionResult = this.result.correct ? 'Correct' : 'Incorrect';
        
        
        // Reference node to insert icon after.
        var questionAnswers = this.content.querySelector('.question-answers');

        // Div to hold icon and text.
        var container = document.createElement('div');
        container.classList.add('question-review-icon');

        // Question result will be correct/incorrect.
        var resultText = questionResult.toLowerCase();

        // Will be correct/incorrect.
        container.classList.add('question-review-' + resultText);

        // Icon element to be inserted.
        var reviewIcon = document.createElement('img');
        reviewIcon.setAttribute('src', '/images/answer-' + resultText + '.svg');

        // Text for icon.
        var textNode = document.createElement('span');
        textNode.textContent = questionResult;

        // img and span element inside div container.
        container.appendChild(reviewIcon);
        container.appendChild(textNode);

        // Inject the element that we created.
        this.content.insertBefore(container, questionAnswers);

        // Add styling to answers for correctness.
        for(var i = 0; i < this.answers.length; i++){
            var answer = this.answers[i];

            var isCorrect = answer.dataset.isCorrect;
            var isSelected = answer.dataset.answerId.toString() === this.result.chosen.toString();
            
            // set the src of the img element
            var answerIcon = document.createElement('img');
            var cssReviewPath = 'question-review-';
            var imagePath = 'images/icon-';
            if (isCorrect){
                answer.classList.add(cssReviewPath + 'correct');
                answerIcon.setAttribute('src', imagePath + 'correct.svg');
            } else if (isSelected && !isCorrect){
                answer.classList.add(cssReviewPath + 'incorrect');
                answerIcon.setAttribute('src', imagePath + 'incorrect.svg');
            }

            // show the explanation for the selected and correct answer.
            if (isCorrect || isSelected){
                answer.classList.add('question-answer-review');

                // query element as reference to insert new element.
                var answerText = answer.querySelector('.answer-text');
                answer.insertBefore(answerIcon, answerText);

                // Show the explanation.
                var explanation = answer.querySelector('.question-answer-explanation');
                    explanation.classList.toggle('hidden');
            }

            // special scenario to add text to indicated selected answer.
            if (isSelected){
                var selectionText = document.createElement('span');
                selectionText.textContent = 'You Selected';
                selectionText.classList.add('selection-text')

                answer.insertBefore(selectionText, answerIcon);
            }
            
        }
    };

    /**
     * Prototyped description of the exercise being taken.
     *
     * @param {Element.<div>} content Element containing the exercise.
     * @param {Number} id The db id of the exercise being taken.
     */
    function Exercise (content, id) {
        this.content = content;
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

    Exercise.prototype.review = function (){
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

})();