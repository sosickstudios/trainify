(function (){
    var querySelector = document.querySelector.bind(document);

    var examBtn = querySelector('.btn--full-exam');

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
        if (data.stats.examAverage){
            examAverage.textContent = data.stats.examAverage + '%';
        } else {
            examAverage.textContent = 'N/A';
        }


        trainingName.textContent = data.name;
        trainingDescription.textContent = data.description;

        // TODO(darius): Determine how much of this should be enabled
        // and how.

        //providerName.textContent = 'Provided By ' + data.company.name;
        //providerBio.textContent = data.company.bio;

        // Make sure we remove the old data listener, if there is one.
        var examLocation = '/exercise?trainingId=' + data.id 
            + '&path=,&category=' + data.category.id + '&type=Exam Prep';
        examBtn.setAttribute('href', examLocation);
    }

    window.Trainify.attachCourseDataListener(dataChange);
})();