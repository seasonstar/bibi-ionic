var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var templateCache  = require('gulp-angular-templatecache');
var rename = require('gulp-rename');
var ngAnnotate = require('gulp-ng-annotate');
var useref = require('gulp-useref');
var sh = require('shelljs');

var paths = {
  sass: ['./scss/**/*.scss'],
  templates: ['./www/templates/**/*.html'],
  ng_annotate: ['./www/js/*.js'],
  useref: ['./www/*.html']
};

gulp.task('default', ['sass', 'views', 'ng_annotate','useref']);

gulp.task('sass', function(done) {
  gulp.src(paths.sass)
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('ng_annotate', function (done) {
    gulp.src(paths.ng_annotate)
      .pipe(ngAnnotate({single_quotes: true}))
      .pipe(gulp.dest('./www/dist/dist_js/app'))
      .on('end', done);
});

gulp.task('useref', function (done) {
    gulp.src(paths.useref)
      .pipe(useref())
      .pipe(gulp.dest('./www/dist'))
      .on('end', done);
});

gulp.task('views', function() {
  return gulp.src(paths.templates)
    .pipe(templateCache({
      standalone: true
    }))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('./www/js/'))
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.templates, ['views']);
  gulp.watch(paths.ng_annotate, ['ng_annotate']);
  gulp.watch(paths.useref, ['useref']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
