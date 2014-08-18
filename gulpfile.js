'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var browserSync = require('browser-sync');
var pagespeed = require('psi');
var reload = browserSync.reload;

var plumber = require('gulp-plumber');

// error handler
var onError = function (err) {
  console.error(err);
  throw err;
};

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src(['app/scripts/**/*.js', '!app/scripts/d3.min.js'])
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

gulp.task('data', function(){

});

// Optimize Images
gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'}));
});

// Copy All Files At The Root Level (app)
gulp.task('copy', function() {
  return gulp.src(['app/*', '!app/*.html'])
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}));
});

gulp.task('sass-dev', function(){
  gulp.src('app/styles/main.scss')
    .pipe($.sass({sourceComments: 'map', sourceMap: 'sass'}))
    .pipe(gulp.dest('app/styles'))
    .pipe($.size({title: 'sass'}))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('sass', function(){
  gulp.src('app/styles/main.scss')
    .pipe($.sass())
    .on('error', console.error.bind(console))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
      // .pipe($.uncss({
      //   html: [
      //     'views/index.hbs',
      //     //'app/styleguide/index.html'
      //   ],
      //   // CSS Selectors for UnCSS to ignore
      //   ignore: [
      //     '.navdrawer-container.open',
      //     /.app-bar.open/
      //   ]
      // }))
      .pipe($.csso())
    .pipe(gulp.dest('app/styles'))
    .pipe($.size({title: 'sass'}));
});

// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function () {
  return gulp.src('app/**/*.html')
    .pipe(plumber({errorHandler: onError}))
    .pipe($.useref.assets({searchPath: 'app'}))
    // Concatenate And Minify JavaScript
    .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
    // Concatenate And Minify Styles
    //.pipe($.if('*.css', $.csso()))
    // Remove Any Unused CSS
    // Note: If not using the Style Guide, you can delete it from
    // the next line to only include styles your project uses.
    .pipe($.useref.restore())
    .pipe($.useref())
    // Update Production Style Guide Paths
    .pipe($.replace('components/components.css', 'components/main.min.css'))
    // Minify Any HTML
    .pipe($.if('*.html', $.minifyHtml()))
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Clean Output Directory
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Watch Files For Changes & Reload
gulp.task('serve', function () {
  browserSync({
    notify: false
  });

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(['views/**/*.hbs'], reload);
  gulp.watch(['app/styles/**/*.scss'], ['sass-dev']);
  gulp.watch(['{.tmp,app}/styles/**/*.css'], reload);
  gulp.watch(['app/scripts/**/*.js'], ['jshint']);
  gulp.watch(['app/images/**/*'], reload);
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  //var runSequence = require('run-sequence');
  // runSequence('styles', ['jshint', 'html', 'images', 'styles', 'copy'], cb);
  //runSequence(['images', 'sass'], cb);
});

// Run PageSpeed Insights
// Update `url` below to the public URL for your site
gulp.task('pagespeed', pagespeed.bind(null, {
  // By default, we use the PageSpeed Insights
  // free (no API key) tier. You can use a Google
  // Developer API key if you have one. See
  // http://goo.gl/RkN0vE for info key: 'YOUR_API_KEY'
  url: 'https://sosickstudios.com',
  strategy: 'mobile'
}));
