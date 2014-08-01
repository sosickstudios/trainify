(function (window){
    var querySelector = document.querySelector.bind(document);

    var trainingName = querySelector('.course-name');
    var trainingDescription = querySelector('.course-description');

    var providerName = querySelector('.provider-name');
    var providerBio = querySelector('.provider-bio');

    function dataChange (data){
        trainingName.innerHTML = data.company.name;
        trainingDescription.innerHTML = data.course.description;

        providerName.innerHTML = 'Provided By ' + data.company.name;
        providerBio.innerHTML = data.company.bio;
    }

    window.Trainify.attachCourseDataListener(dataChange);
})(window);