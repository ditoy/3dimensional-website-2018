import {spawn} from 'child_process';
import fs from 'fs';
import hugoBin from 'hugo-bin';
import gutil from 'gulp-util';
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import htmlmin from 'gulp-htmlmin';
import BrowserSync from 'browser-sync';
import watch from 'gulp-watch';
import gulp from 'gulp';
import webpack from 'webpack';
import webpackConfig from './webpack.conf';

const browserSync = BrowserSync.create();

// Hugo arguments
const hugoArgsDefault = ['-d', '../dist', '-s', 'site', '-v'];
const hugoArgsPreview = ['--buildDrafts', '--buildFuture'];

// Development tasks
gulp.task('hugo', (cb) => buildSite(cb));
gulp.task('hugo-preview', (cb) => buildSite(cb, hugoArgsPreview));

// Build/production tasks
gulp.task('build', ['truncate',  'polyfill', 'sass', 'js'], (cb) => buildSite(cb, [], 'production'));
gulp.task('build-preview', ['truncate',  'polyfill', 'sass', 'js'], (cb) => buildSite(cb, hugoArgsPreview, 'production'));

// Remove previously compiled CSS files
gulp.task('truncate', () => {
    fs.truncate('./dist/css/main.css', (err) => {});
});

// SASS task, including css post-processing (autoprefixer and minification)
gulp.task('sass', () => {
    let processors = [
        autoprefixer({
            browsers: ['last 4 versions', '> 1%'] // last 4 versions or exceeding 1% market share
        }),
        cssnano()
    ];

    // compile sass to css and post-process
    gulp.src('./src/css/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(gulp.dest('./dist/css'))
        .pipe(browserSync.stream())
    ;
});

// Compile Javascript
gulp.task('js', (cb) => {
    const myConfig = Object.assign({}, webpackConfig);

    webpack(myConfig, (err, stats) => {
        if (err) throw new gutil.PluginError('webpack', err);
        gutil.log('[webpack]', stats.toString({
            colors: true,
            progress: true
        }));
        browserSync.reload();
        cb();
    });
});

// Copy polyfills and shims to the dist folder
gulp.task('polyfill', () => {
    const files = [
        './node_modules/respond.js/dest/respond.min.js',
        './node_modules/html5shiv/dist/html5shiv.js',
        './node_modules/selectivizr/selectivizr.js',
        './node_modules/rem-unit-polyfill/js/rem.js'
    ];
    gulp.src(files)
        .pipe(gulp.dest('./dist/js/'))
        .pipe(browserSync.stream())
    ;
});

// minify static html files created by hugo
gulp.task('htmlmin', () => {
    return gulp.src('dist/**/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('dist'));
});

// Development server with browsersync
gulp.task('server', ['hugo', 'truncate',  'polyfill', 'sass', 'js'], () => {
    browserSync.init({
        server: {
            baseDir: './dist'
        }
    });
    watch('./src/js/**/*.js', () => { gulp.start(['js']); });
    watch('./src/css/**/*.scss', () => { gulp.start(['truncate', 'sass']); });
    watch('./site/**/*', () => { gulp.start(['hugo']); });
});

/**
 * Run hugo and build the site
 */
function buildSite(cb, options, environment = 'development') {
    const args = options ? hugoArgsDefault.concat(options) : hugoArgsDefault;

    process.env.NODE_ENV = environment;

    return spawn(hugoBin, args, {stdio: 'inherit'}).on('close', (code) => {
        if (code === 0) {
            // HTML minification - turn on prod only....
            gulp.start('htmlmin', () => {
                browserSync.reload();
            });

            browserSync.reload();
            cb();
        } else {
            browserSync.notify('Hugo build failed :(');
            cb('Hugo build failed');
        }
    });
}
