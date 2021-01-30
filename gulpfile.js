var gulp       = require('gulp'),
    series     = require('gulp').series,
    parallel   = require('gulp').parallel,
    minifyHtml = require('gulp-minify-html'),
    minifyCss  = require('gulp-minify-css'),
    concat     = require('gulp-concat'),
    del        = require('del'),
    uglify     = require('gulp-uglify'),
    jshint     = require('gulp-jshint'),
    stylish    = require('jshint-stylish'),
    zip        = require('gulp-zip');


//lint it out
function hint () {
    return gulp.src(['./src/js/background/**/*', './src/js/content_script/**/*', './src/js/options/**/*', './src/js/popup/**/*'])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
}

//clear out the folder
function empty () {
    del(['./dist/**', '!./dist', '!./dist/.gitignore', './bishop.zip']);
}


// minify our html
function html () {
    return gulp.src('./src/html/*.html')
        .pipe(minifyHtml())
        .pipe(gulp.dest('./dist/'));
}

//minify & concat our CSS
function main_css () {
    return gulp.src('./src/css/*')
        .pipe(minifyCss())
        .pipe(concat('style.css'))
        .pipe(gulp.dest('./dist/'));
}

function alert_css () {
    return gulp.src('./src/css/alert.css')
        .pipe(minifyCss())
        .pipe(concat('alert.css'))
        .pipe(gulp.dest('./dist/'));
}

//minify and concat our js

//background
function js_background () {
    return gulp.src('./src/js/background/*')
        .pipe(uglify())
        .pipe(concat('background.js'))
        .pipe(gulp.dest('./dist/'));
}

//content_script
function js_content () {
    return gulp.src('./src/js/content_script/*')
        .pipe(uglify())
        .pipe(concat('content_script.js'))
        .pipe(gulp.dest('./dist/'));
}

//popup
function js_popup () {
    return gulp.src('./src/js/popup/*')
        .pipe(uglify())
        .pipe(concat('popup.js'))
        .pipe(gulp.dest('./dist/'));
}

//options
function js_options () {
    return gulp.src('./src/js/options/*')
        .pipe(uglify())
        .pipe(concat('options.js'))
        .pipe(gulp.dest('./dist/'));
}

//lib
function css_lib () {
    return gulp.src([
            './node_modules/bootstrap/dist/css/bootstrap.min.css',
            './node_modules/intro.js/introjs.css',
            './src/css/bootsrap-growl.css',
        ])
        .pipe(concat('lib.css'))
        .pipe(gulp.dest('./dist/'));
}

function js_lib () {
    return gulp.src([
            './node_modules/jquery/dist/jquery.min.js',
            './node_modules/bootstrap/dist/js/bootstrap.min.js',
            './node_modules/bootstrap-notify/bootstrap-notify.min.js',
            './node_modules/intro.js/minified/intro.min.js'
        ])
        .pipe(concat('lib.js'))
        .pipe(gulp.dest('./dist/'));
}

//move over remaining files
function copy () {
    return gulp.src(['./src/audio/**/*', './src/img/**/*', './src/fonts/**/*', './src/manifest.json'], {
        base: 'src'
    }).pipe(gulp.dest('./dist'));
}

function zipProject () {
    return gulp.src('dist/**/*')
        .pipe(zip('bishop.zip'))
        .pipe(gulp.dest('./'));
}

//realtime watching
function realtime () {
    gulp.watch('./src/js/**/*', js);
    gulp.watch('./src/html/**/*', html);
    gulp.watch('./src/css/**/*', css);
    gulp.watch(['./src/audio/**/*', './src/img/**/*', './src/fonts/**/*', './src/manifest.json'], copy);
}

//tie it all together
const js = parallel(js_background, js_content, js_popup, js_options, js_lib);
const css = series(css_lib,);


exports.js_background = js_background;
exports.js_content = js_content;
exports.js_popup = js_popup;
exports.js_options = js_options;
exports.js_lib = js_lib;

exports.css_lib = css_lib;

exports.zip = zipProject;

exports.js = js;
exports.css = css;

exports.realtime = realtime;

exports.watch = gulp.parallel(realtime, html, css, js, copy);
exports.default = series(hint, html, css, js, copy);

