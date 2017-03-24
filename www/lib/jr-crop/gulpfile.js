var gulp = require('gulp'); 
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var header = require('gulp-header');
var bower = require('./bower.json');

var banner = [
  '/**',
  ' * <%= bower.name %> - <%= bower.description %>',
  ' * @version <%= bower.version %>',
  ' * @link <%= bower.homepage %>',
  ' * @author <%= bower.authors.join(", ") %>',
  ' * @license <%= bower.license %>',
  ' */', '', ''].join('\n');

gulp.task('lint', function () {
  return gulp.src('src/jr-crop.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function () {
  return gulp.src('src/jr-crop.js')
    .pipe(header(banner, { bower: bower } ))
    .pipe(gulp.dest('dist'))
    .pipe(rename('jr-crop.min.js'))
    .pipe(uglify())
    .pipe(header(banner, { bower: bower } ))
    .pipe(gulp.dest('dist'));
});

gulp.task('style', function () {
  return gulp.src('src/jr-crop.scss')
    .pipe(sass())
    .pipe(header(banner, { bower: bower } ))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
  gulp.watch('src/**/*', ['default']);
});

gulp.task('default', ['lint', 'scripts', 'style']);