(function (){
    var querySelector = document.querySelector.bind(document);

    var examBtn = querySelector('.generate-exam');

    var trainingName = querySelector('.course-name');
    var trainingDescription = querySelector('.course-description');

    var providerName = querySelector('.provider-name');
    var providerBio = querySelector('.provider-bio');

    var courseCount = querySelector('.course-count .dash-text');
    var passCount = querySelector('.exam-passcount .dash-text');
    var failCount = querySelector('.exam-failcount .dash-text');
    var examAverage = querySelector('.exam-average .dash-text');

    var examBtnListener;
    function dataChange (data){
        //courseCount.textContent = data.stats.courseCount;
        passCount.textContent = data.stats.passCount;
        failCount.textContent = data.stats.failCount;
        examAverage.textContent = data.stats.examAverage + '%';

        trainingName.textContent = data.name;
        trainingDescription.textContent = data.description;

        providerName.textContent = 'Provided By ' + data.company.name;
        providerBio.textContent = data.company.bio;

        // Make sure we remove the old data listener, if there is one.
        examBtn.removeEventListener('click', examBtnListener);

        examBtnListener = function (){
            location.href = '/exercise?trainingId=' + data.id + '&path=,&category=' + data.category.id + '&type=Exam Prep';
        };

        // Attach the new listener, with the new location.href set.
        examBtn.addEventListener('click', examBtnListener);
    }

    window.Trainify.attachCourseDataListener(dataChange);
})();