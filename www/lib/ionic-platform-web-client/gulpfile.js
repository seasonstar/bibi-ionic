var gulp = require('gulp'),
  buildConfig = require('./build/config.js'),
  gutil = require('gulp-util'),
  concat = require('gulp-concat'),
  footer = require('gulp-footer'),
  header = require('gulp-header'),
  watch = require('gulp-watch'),
  browserify = require("browserify"),
  babelify = require("babelify"),
  fs = require("fs"),
  eslint = require('gulp-eslint'),
  replace = require('gulp-replace'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename')
  del = require('del');

gulp.task('version', ['minify'], function() {
  return gulp.src('dist/*.js')
    .pipe(replace('VERSION_STRING', buildConfig.versionData.version))
    .pipe(gulp.dest('dist'));
});

gulp.task('minify', ['build-bundle'], function() {
  return gulp.src('dist/*.js')
    .pipe(uglify())
    .pipe(rename(function (path) {
      path.basename += ".min";
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['version']);

gulp.task('build-core-module', ['clean'], function () {
  var stream = null;
  browserify({
    entries: buildConfig.sourceFiles.core,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(steam = fs.createWriteStream(buildConfig.dist + "/core.js"));
  return stream;
});

gulp.task('build-push-module', ['build-core-module'], function () {
  return browserify({
    entries: buildConfig.sourceFiles.push,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/push.js"));
});

gulp.task('build-deploy-module', ['build-push-module'], function () {
  return browserify({
    entries: buildConfig.sourceFiles.deploy,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/deploy.js"));
});

gulp.task('build-analytics-module', ['build-deploy-module'], function () {
  return browserify({
    entries: buildConfig.sourceFiles.analytics,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/analytics.js"));
});

gulp.task('test', function() {

});

gulp.task('build-bundle', ['clean'], function () {
  return browserify({
    entries: buildConfig.sourceFiles.bundle,
    debug: false,
    transform: [babelify]
  }).bundle()
  .on("error", function (err) { console.log("Error : " + err.message); })
  .pipe(fs.createWriteStream(buildConfig.dist + "/ionic.io.bundle.js"));
});

gulp.task('clean', ['lint'], function() {
  return del(['dist/**/*']);
});

gulp.task('lint', function () {
  return gulp.src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.failOnError())
    .pipe(eslint.formatEach());
});

gulp.task('watch', ['build'], function() {
  gulp.watch(['src/**/*.js'], ['build']);
});

gulp.task('default', ['build']);
