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

    function dataChange (data){
        var course = data;
        //courseCount.textContent = data.stats.courseCount;
        passCount.textContent = course.stats.general.passCount;
        failCount.textContent = course.stats.general.failCount;
        
        if (course.stats.general.examAverage){
            examAverage.textContent = course.stats.general.examAverage + '%';
        } else {
            examAverage.textContent = 'N/A';
        }


        trainingName.textContent = course.name;
        trainingDescription.textContent = course.description;

        // TODO(darius): Determine how much of this should be enabled
        // and how.

        //providerName.textContent = 'Provided By ' + data.company.name;
        //providerBio.textContent = data.company.bio;

        // Make sure we remove the old data listener, if there is one.
        var examLocation = '/exercise?trainingId=' + course.id 
            + '&tree=matrix&type=Exam Prep';
        examBtn.setAttribute('href', examLocation);
    }

    window.Trainify.attachCourseDataListener(dataChange);
})();