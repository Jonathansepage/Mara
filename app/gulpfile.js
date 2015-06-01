var gulp = require('gulp'),
	sass = require('gulp-ruby-sass'),
	prefix = require('gulp-autoprefixer'),
	rename = require('gulp-rename'),
	watchify = require('watchify'),
	browserify = require('browserify'),
	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
	uglify = require('gulp-uglify'),
	gutil = require('gulp-util'),
	sourcemaps = require('gulp-sourcemaps'),
	assign = require('lodash.assign'),
	livereload = require('gulp-livereload'),
	hbsify = require('hbsify')
	;

// custom browserify options
var customOpts = {
    entries: ['./assets/js/app.js'],
    debug: true,
    transform: ['hbsify'],

    // require(/path/to/file.js) directly from those paths
    paths: [
        './node_modules',
        './assets/js/',
        './assets/js/lib/',
        './assets/js/modules/',
        './assets/js/views/',
        './templates/'
    ]
};

var opts = assign({}, watchify.args, customOpts);
var b = browserify(opts);
var w = watchify(b);

gulp.task('js', bundle); // so you can run `gulp js` to build the file
w.on('update', bundle); // on any dep update, runs the bundler
w.on('log', gutil.log); // output build logs to terminal

function bundle() {
    return b.bundle()

    // log errors
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))

    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())

    // compress
    //.pipe(uglify())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
    .pipe(sourcemaps.write('./')) // writes .map file

    .pipe(gulp.dest('./assets/js'))
    .pipe(livereload({start: true}));
}

gulp.task('compressJS', function(){
	return gulp.src('./assets/js/bundle.js')
		.pipe(uglify())
		.pipe(gulp.dest('./assets/js'));
})


///////// SASS COMPILATION ////////

var paths = {
	src: 'assets/scss/',
	files: 'assets/scss/**/*.scss',
	dest: 'assets/styles/'
}

// Compile Sass (nested)
gulp.task('sassToNested', function () {
	gulp.src(paths.files)
	.pipe(sass({
		lineNumbers: true,
		style: 'nested',
	}))
	.pipe(prefix(
		'last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'
	))
	.pipe(gulp.dest(paths.dest))
});

// Compile Sass (compressed)
gulp.task('sassToCompressed', function () {
	gulp.src(paths.files)
	.pipe(sass({
		lineNumbers: false,
		style: 'compressed',
	}))
	.pipe(prefix(
		'last 2 version', 'safari 5'
	))
	.pipe(rename('main.min.css'))
	.pipe(gulp.dest(paths.dest))
});



gulp.task('watchSASS', function(){
	// Watch the files in the paths object, and when there is a change, fun the functions in the array
	gulp.watch(paths.files, ['sassToNested'])
	// Also when there is a change, display what file was changed, only showing the path after the 'sass folder'
	.on('change', function(evt) {
		console.log(
			'[watcher] File ' + evt.path.replace(/.*(?=sass)/,'') + ' was ' + evt.type + ', compiling...'
		);
	})
})

// Watch Files For Changes
gulp.task('default', ['watchSASS', 'js']);

// prod
gulp.task('prod', function() {
    gulp.start('sassToCompressed', 'js', 'compressJS');
});