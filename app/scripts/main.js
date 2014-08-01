/*!
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
(function () {
  'use strict';

  var querySelector = document.querySelector.bind(document);

  var navdrawerContainer = querySelector('.navdrawer-container');
  var body = document.body;
  var appbarElement = querySelector('.app-bar');
  var courseBtn = querySelector('.app-bar-all-courses');
  var menuBtn = querySelector('.menu');

  function closeMenu() {
    body.classList.remove('open');
    appbarElement.classList.remove('open');
    navdrawerContainer.classList.remove('open');
  }

  var courseData = null;
  var currentCourse = null;
  var initialized = false;
  var listeners = [];

  /**
   * Attaches a listener for changes to the currently selected training course. If the data is 
   * initialized already, the callback will be called before being added to the listeners array.
   *
   * @param {Function<Training>} listener Callback for changes to training course.
   */
  function attachCourseListener(listener){
    // Should the data be initialized, call the callback with the data.
    if (initialized){
      listener(currentCourse);
    }
    
    // Add the listener to the array of listeners, to be called in the event of a change.
    listeners.push(listener);
  }

  /**
   * Should the training course change from selection, or if the data is newly loaded, call all 
   * listeners in the listeners array.
   *
   * @param {Object.<Training>} course The training course that has been selected, or initialized
   * to.
   */
  function toggleCourseChange(course){
    if (!initialized) return;

    // Go through the array of listeners and pass in the newly selected or loaded training course.
    for (var i = 0; i < listeners.length; i++){
      var callback = listeners[i];
      callback(course);
    }
  }

  /**
   * Called when the data for the training courses has been loaded. Automatically defaults to the 
   * first training course, then calls the toggleCourseChange function to let all listeners know 
   * that there is new data.
   *
   * @param {[Object<Training>]} data Contains an array of training courses that have been purchased
   * and may be purchased.
   */
  function initCourseData(data){
    courseData = data;
    currentCourse = courseData[0];
    initialized = true;

    // Let all attached listeners know that new data has been loaded.
    toggleCourseChange(currentCourse);
  }

  // Attach the Trainify object to the window so other scripts can latch on.
  window.Trainify = {
    attachCourseDataListener: attachCourseListener,
    initCourseData: initCourseData
  };

  courseBtn.addEventListener('click', function (){
    toggleCourseChange(currentCourse);
  });

  function toggleMenu() {
    body.classList.toggle('open');
    appbarElement.classList.toggle('open');
    navdrawerContainer.classList.toggle('open');
  }

  menuBtn.addEventListener('click', toggleMenu);
  navdrawerContainer.addEventListener('click', function (event) {
    if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
      closeMenu();
    }
  });
})();
