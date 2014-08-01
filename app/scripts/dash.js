(function (){
    var querySelector = document.querySelector.bind(document);

    var trainingName = querySelector('.course-name');
    var trainingDescription = querySelector('.course-description');

    var providerName = querySelector('.provider-name');
    var providerBio = querySelector('.provider-bio');

    var courseCount = querySelector('.course-count .dash-text');
    var passCount = querySelector('.exam-passcount .dash-text');
    var failCount = querySelector('.exam-failcount .dash-text');
    var examAverage = querySelector('.exam-average .dash-text');

    function dataChange (data){
        courseCount.innerHTML = '1';
        passCount.innerHTML = '8';
        failCount.innerHTML = '3';
        examAverage.innerHTML = '88%';

        trainingName.innerHTML = data.course.name;
        trainingDescription.innerHTML = data.course.description;

        providerName.innerHTML = 'Provided By ' + data.company.name;
        providerBio.innerHTML = data.company.bio;
    }

    window.Trainify.attachCourseDataListener(dataChange);
})();