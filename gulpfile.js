var
  fs = require("fs"),
  argv = require("yargs").argv,
  gulp = require("gulp"),
  plugins = require('gulp-load-plugins')({
    pattern: ["glob", "gulp-*", "browser-*", "hygienist-*"]
  });

var paths = {
  development: ".",
  production: "public/",
  styleguide: "public/styleguide/",

  pages: "*.html",
  jade: "assets/jade/*.jade",
  glob_jade: "assets/jade/**/*.jade",
  ignore_jade: "!assets/jade/**/_*",

  scss: "assets/scss/*.scss",
  css: "assets/css",
  glob_scss: "assets/scss/**/*.scss",
  glob_css: "assets/css/*.css",

  js: "assets/js/*.js",
  glob_js: "assets/js/**/*.js",

  images: "assets/images",
  glob_images: "assets/images/**/*",
  ignore_images: "!assets/images/ignore{,/**}",

  glob_svg: "assets/svg/*",

  fallbacks: "assets/images/fallbacks",

  glob_data: "assets/data/*.json",

  kss: "assets/kss",
  kss_css: "assets/css/styleguide.css"
};

/*
------------------------------ Basic. -----------------------------
*/

gulp.task("server", function() {
  plugins.browserSync({
    server: {
      baseDir: paths.development,
      middleware: plugins.hygienistMiddleware(paths.development)
    },
    xip: true,
    notify: false
  });
});

gulp.task("styles", function () {
  return gulp.src(paths.scss)
    .pipe(plugins.plumber())
    .pipe(plugins.sass({
      errLogToConsole: true,
      includePaths: require("node-neat").with("bower_components/")
    }))
    .pipe(gulp.dest(paths.css))
    .pipe(plugins.browserSync.reload({
      stream: true
    }));
});

var
  jsonFiles,
  jsonGroup;

gulp.task("fetch-data", function() {
  jsonFiles = plugins.glob.sync(paths.glob_data),
  jsonGroup = fs.readFileSync(jsonFiles[0], "utf8");

  // Add other files if more than one.
  if (jsonFiles.length > 1) {
    for (i = 1; i < jsonFiles.length; i++) {
      jsonGroup += ",\n" + fs.readFileSync(jsonFiles[i], "utf8");
    }
  }
  // Make an array out of it.
  jsonGroup = "{" + jsonGroup + "}";
});

gulp.task("templates", ["fetch-data"], function() {
  return gulp.src([paths.glob_jade, paths.ignore_jade])
    .pipe(plugins.plumber())
    .pipe(plugins.jade({
      pretty: true,
      locals: JSON.parse(jsonGroup)
    }))
    .pipe(gulp.dest(paths.development));
});

gulp.task("pages", ["templates"], function() {
  plugins.browserSync.reload();
});

gulp.task("refresh", function() {
  plugins.browserSync.reload();
});

gulp.task("scan", function () {
  // Using gulp.start soon to be deprecated.
  plugins.watch(paths.glob_scss, function(files, cb) {
    gulp.start("styles", cb);
  });
  plugins.watch([paths.glob_jade, paths.glob_data], function(files, cb) {
    gulp.start("pages", cb);
  });
  plugins.watch([paths.glob_js], function(files, cb) {
    gulp.start("refresh", cb);
  });
});

/*
---------------------------- Build. ----------------------------
*/

var productionFiles = [];

// Delete the previous build.
gulp.task("build-wipe", function() {
  if (argv.full) {
    return gulp.src(paths.production, {read: false})
      .pipe(plugins.clean());
  } else return;
});

// Minify CSS and JS.
gulp.task("build-compile", ["build-wipe"], function() {
  return gulp.src(paths.pages)
    .pipe(plugins.usemin({
      js: [plugins.uglify()],
      css: [
        plugins.minifyCss({
          keepSpecialComments: 0
        })]
    }))
    .pipe(gulp.dest(paths.production));
});

// Move other assets to production folder.
gulp.task("build-move", ["build-wipe"], function() {
  gulp.src(productionFiles, {base: paths.development})
    .pipe(gulp.dest(paths.production));
});

// Minify images if provided with --full argument.
gulp.task("build-images", ["build-wipe"], function() {
  if (argv.full) {
    return gulp.src([paths.glob_images, paths.ignore_images])
      .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}]
      }))
      .pipe(gulp.dest(paths.production + paths.images));
  };
});

// Strip unused CSS afterwards if --uncss provided.
gulp.task("build-strip", ["build-compile"], function() {
  if (argv.uncss) {
    return gulp.src(paths.production + paths.glob_css)
      .pipe(plugins.uncss({
        html: plugins.glob.sync(paths.pages),
        ignore: [/::?-[\w\d]+/]
      }))
      .pipe(plugins.minifyCss({
        keepSpecialComments: 0
      }))
      .pipe(plugins.size({
        showFiles: true
      }))
      .pipe(gulp.dest(paths.production + paths.css));
  }
});

/*
---------------------------- Deploy. ----------------------------
*/

gulp.task("deploy", function() {
  return gulp.src(paths.production + "**/*")
    .pipe(plugins.ftp({
      host: "chrisjansky.cz",
      user: "w85799",
      pass: "",
      remotePath: "www/subdom/work/happytimes"
    }))
    .pipe(plugins.size());
});

/*
----------------------------- SVG. ------------------------------
*/

// Delete the PNG fallbacks/ folder.
gulp.task("svg-wipe", function() {
  return gulp.src(paths.fallbacks, {read: false})
    .pipe(plugins.clean());
});

// Render PNG fallbacks for SVG.
gulp.task("svg", ["svg-wipe"], function() {
  return gulp.src(paths.glob_svg)
    .pipe(plugins.svg2png())
    .pipe(gulp.dest(paths.fallbacks));
});

/*
-------------------------- Styleguide. --------------------------
*/

var styleguideFiles = [
  "assets/kss/assets/prism.css"
];

gulp.task("styleguide-wipe", ["build-wipe"], function() {
  return gulp.src(paths.styleguide, {read: false})
    .pipe(plugins.clean());
});

gulp.task("styleguide-move", ["styleguide-wipe"], function() {
  return gulp.src(styleguideFiles, {base: paths.kss})
    .pipe(gulp.dest(paths.styleguide));
});

gulp.task("styleguide-styles", ["styleguide-move"], function() {
  return gulp.src(paths.kss_css)
    .pipe(plugins.minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(plugins.rename(function (path) {
        path.basename += "-min";
    }))
    .pipe(gulp.dest(paths.production + paths.css));
});

gulp.task("styleguide-compile", ["styleguide-styles"], function() {
  return gulp.src(paths.glob_scss)
    .pipe(plugins.kss({
      overview: paths.kss + "/styleguide.md",
      templateDirectory: paths.kss
    }))
    .pipe(gulp.dest(paths.styleguide));
});

/*
-------------------------- Task groups. ---------------------------
*/
gulp.task("default", ["compile", "server", "scan"]);
gulp.task("compile", ["styles", "pages"]);

// Wipe first. Move, produce. Images if --full. Strip if --uncss.
gulp.task("build", ["build-move", "build-images", "build-strip"]);

gulp.task("styleguide", ["build-compile", "styleguide-compile"]);