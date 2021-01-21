var gulp = require('gulp');
var uglify = require('gulp-uglify-es').default; //JS压缩
var gutil = require('gulp-util');
var clean=require('gulp-clean');

//压缩node-red中的JS文件
gulp.task('node-red', function () {
  return gulp.src([
      'node-flow/lib/**/**.js',
    ])
    .pipe(uglify()) //压缩
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('build/node-flow/lib'));

});

//压缩app.js文件
gulp.task('app', function () {
  return gulp.src([
      'app.js',
      'route.js'
    ])
    .pipe(uglify()) //压缩
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('build'));

});


//文件拷贝部分：
gulp.task('copy-node-modules', function () {
  return gulp.src([
      'node_modules/**/*',
    ])
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('build/node_modules'))
});

//node-flow拷贝配置信息
gulp.task('copy-node-flow', function () {
  return gulp.src([
      'node-flow/node_modules/**/*',
      'node-flow/*.json',
      'node-flow/.config.json'
    ],{base:'.'})
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('build'))
});

//拷贝配置信息
gulp.task('copy-config', function () {
  return gulp.src([
      '*.js',
      '!gulpfile.js',
      '*.json',
      '*.bat'
    ])
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('build/'))
});

//
gulp.task('copy-node-red', function () {
  return gulp.src([
      'node-flow/lib/**/*'
    ],{
      base: '.'
    })
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('build'))
});

//
gulp.task('copy-public', function () {
  return gulp.src([
      'public/**/*',
      'views/**/*',
      'src/lib/**/*'
    ],{
      base: '.'
    })
    // .pipe(flatten())
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('build'))
});




//清理任务，每次打包清理build文件夹
gulp.task('clean:app', function() {
  return gulp.src('build', {allowEmpty: true})
      .pipe(clean());
});


//进行init任务，先清理后打包拷贝
gulp.task('init', gulp.series('clean:app', gulp.parallel('copy-node-red','copy-public','copy-node-modules','copy-node-flow','copy-config')));


gulp.task('uglify', gulp.series('init', gulp.parallel('node-red','app')));
// 生成打包文件
gulp.task('build', gulp.series('uglify'));




