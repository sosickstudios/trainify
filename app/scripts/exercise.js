(function (){

    /**
     * Prototypes representation of each question in an exercise.
     *
     * @param {Element.<li>} question The element that has been queried that contains the question.
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

        /**
         * If we send off an update request for a Question we can put together the request here.
         *
         * @return {Object} This will return an object in the format of a result.
         */
        this.getRequest = function(){
            return {
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
            this.selectAnswer(e.target);
            this.sendUpdateRequest();
        }.bind(this));
    }

    /** 
     * The question answer list has been clicked on, we should go through our answers
     * and reflect the selection.
     *
     * @param {Event} event The event passed in from the listener.
     */
    Question.prototype.selectAnswer = function (element){
        var answer = element;

        // Set the current chosen answer to the answer id.
        this.result.chosen = answer.dataset.answerId;

        for(var i = 0; i < this.answers.length; i++){
            var item = this.answers[i];

            //TODO(BRYCE) Need to do some css here to set the element to a chosen state/unset
            //unchosen.
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
        return this.content.dataset.questionResult && this.content.dataset.questionAnswered;
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
    Question.prototype.sendUpdateRequest = function () {
        var request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if(request.readyState === 4 && request.status === 200){
                this.setRequest(request.response);
            }
        }.bind(this);

        request.open('PUT', '/exercise', true);
        request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        request.send(JSON.stringify(this.getRequest()));
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
    Exercise.prototype.addQuestion = function (content, number){
        var question = new Question(content, this);
        this.questions.push(question);
    };

    Exercise.prototype.questionCount = function (){
        return this.questions.length;
    };

    var querySelector = document.querySelector.bind(document);

    var exercise;
    function init (){
        var content = querySelector('.exercise');
        var exerciseId = content.dataset.exerciseId;

        exercise = new Exercise(content, exerciseId);
    }
    init();

})();