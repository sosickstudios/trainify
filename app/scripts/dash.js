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
        courseCount.textContent = '1';
        passCount.textContent = '8';
        failCount.textContent = '3';
        examAverage.textContent = '88%';

        trainingName.textContent = data.name;
        trainingDescription.textContent = data.description;

        providerName.textContent = 'Provided By ' + data.company.name;
        providerBio.textContent = data.company.bio;
    }

    window.Trainify.attachCourseDataListener(dataChange);
})();