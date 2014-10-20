var
  fs = require("fs"),
  argv = require("yargs").argv,
  glob = require("glob"),

  gulp = require("gulp"),
  bsync = require("browser-sync"),
  hygienist = require("hygienist-middleware"),

  clean = require("gulp-clean"),
  size = require("gulp-size"),
  rename = require("gulp-rename"),
  watch = require("gulp-watch"),
  plumber = require("gulp-plumber"),

  sass = require("gulp-sass"),
  jade = require("gulp-jade"),

  autoprefix = require("gulp-autoprefixer"),
  usemin = require("gulp-usemin"),
  imagemin = require("gulp-imagemin"),
  minify = require("gulp-minify-css"),
  uglify = require("gulp-uglify"),
  uncss = require("gulp-uncss"),

  svgpng = require("gulp-svg2png"),
  svgsprite = require("gulp-svg-sprites");
  // gulpkss = require("gulp-kss"),

var paths = {
  development: ".",
  production: "public/",

  pages: "*.html",
  jade: "assets/jade/*.jade",
  glob_jade: "assets/jade/**/*.jade",
  ignore_jade: "!assets/jade/**/_*",

  scss: "assets/scss/*.scss",
  css: "assets/css",
  glob_scss: "assets/scss/**/*.scss",
  glob_css: "assets/css/*.css",

  js: "assets/js/*.js",

  images: "assets/images",
  fallbacks: "assets/images/fallbacks",
  glob_images: "assets/images/**/*",
  ignore_images: "!assets/images/ignore{,/**}",
  
  svg: "assets/svg",
  glob_svg: "assets/svg/source/*",

  glob_data: "assets/data/*.json"
  // kss: "assets/kss/*.html",
  // kss_css: "assets/scss/kss.scss",
};

// Declare files to move to public/ during "build" task.
var productionFiles = [
  "assets/fonts/*",
  "assets/favicon.ico"
];

// Super-dumb JSON concatenation. Winning!
var
  jsonFiles,
  jsonGroup;

gulp.task("fetch-data", function() {
  jsonFiles = glob.sync(paths.glob_data),
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

// Compile SCSS to CSS.
gulp.task("styles", function () {
  return gulp.src(paths.scss)
    .pipe(plumber())
    .pipe(sass({
      errLogToConsole: true,
      includePaths: require("node-neat").with("bower_components/")
    }))
    .pipe(gulp.dest(paths.css))
    .pipe(bsync.reload({stream: true}));
});

gulp.task("pages", ["templates"], function() {
  bsync.reload();
});

gulp.task("templates", ["fetch-data"], function() {
  return gulp.src([paths.glob_jade, paths.ignore_jade])
    .pipe(plumber())
    .pipe(jade({
      pretty: true,
      locals: JSON.parse(jsonGroup)
    }))
    .pipe(gulp.dest(paths.development));
});

// gulp.task("kss", function() {
//   gulp.src(paths.glob_scss)
//     .pipe(gulpkss({
//       overview: "assets/kss/styleguide.md",
//       templateDirectory: "assets/kss/"
//     }))
//     .pipe(gulp.dest("public/styleguide"));
//   gulp.src(paths.kss_css)
//     .pipe(sass({
//       errLogToConsole: true,
//       includePaths: require("node-neat").with("bower_components/")
//     }))
//     .pipe(minify())
//     .pipe(rename("kss-min.css"))
//     .pipe(gulp.dest(paths.production + paths.css));
// });

// Delete the assets/fallbacks/ folder.
gulp.task("svg-wipe", function() {
  return gulp.src(paths.fallbacks, {read: false})
    .pipe(clean());
});

// Render PNG fallbacks for SVG.
gulp.task("svg-fallback", ["svg-wipe"], function() {
  return gulp.src(paths.glob_svg)
    .pipe(svgpng())
    .pipe(gulp.dest(paths.fallbacks));
});

// Combine all SVG assets into one.
gulp.task("svg-combine", function() {
  return gulp.src(paths.glob_svg)
    .pipe(svgsprite({
      mode: "symbols",
      // svgId: "svg-%f",
      // preview: false,
      svg: {
        symbols: "complete.svg"
      },
      preview: {
        symbols: "index.html"
      }
    }))
    .pipe(size({
      showFiles: true
    }))
    .pipe(gulp.dest(paths.svg));
})

// Minify CSS and JS.
gulp.task("produce", ["wipe"], function() {
  return gulp.src(paths.pages)
    .pipe(plumber())
    .pipe(usemin({
      js: [uglify()],
      css: [
        autoprefix({
          cascade: false
        }),
        minify({
          keepSpecialComments: 0
        })]
    }))
    .pipe(gulp.dest(paths.production));
});

// Move other assets to production folder.
gulp.task("move", ["wipe"], function() {
  gulp.src(productionFiles, {base: paths.development})
    .pipe(gulp.dest(paths.production));
});

// Delete the previous build if provided with --full argument.
gulp.task("wipe", function() {
  if (argv.full) {
    return gulp.src(paths.production, {read: false})
      .pipe(clean());
  } else return;
});

// Minify images if provided with --full argument.
gulp.task("images", ["wipe"], function() {
  if (argv.full) {
    return gulp.src([paths.glob_images, paths.ignore_images])
      .pipe(plumber())
      .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}]
      }))
      .pipe(gulp.dest(paths.production + paths.images));
  };
});

// Wait for "produce" and strip unused CSS afterwards if --uncss provided.
gulp.task("strip-css", ["produce"], function() {
  if (argv.uncss) {
    return gulp.src(paths.production + paths.glob_css)
      .pipe(plumber())
      .pipe(uncss({
        html: glob.sync(paths.pages),
        // Ignore pseudo selectors.
        ignore: [/::?-[\w\d]+/]
      }))
      .pipe(minify())
      .pipe(size({
        showFiles: true
      }))
      .pipe(gulp.dest(paths.production + paths.css));
  }
});

// Wait for "compile" before starting up server.
gulp.task("server", ["compile"], function() {
  bsync({
    server: {
      baseDir: paths.development,
      middleware: hygienist(paths.development)
    },
    xip: true,
    notify: false
  });
});

gulp.task("scan", function () {
  // Traditional watch not working.
  // gulp.watch(paths.glob_scss, ["styles"]);
  // gulp.watch(paths.glob_jade, ["templates"]);
  // gulp.watch(paths.data, ["templates"]);

  // Using gulp.start, soon to be deprecated
  watch(paths.glob_scss, function() {
    gulp.start("styles");
  });
  watch(paths.glob_jade, function() {
    gulp.start("pages");
  });
  watch(paths.glob_data, function() {
    gulp.start("pages");
  });
  watch(paths.js, function() {
    bsync.reload();
  });
  // watch(paths.kss, ["kss"]);
});

gulp.task("default", ["compile", "server", "scan"]);
gulp.task("svg", ["svg-fallback", "svg-combine"]);
gulp.task("compile", ["styles", "pages"]);

// Wipe if --full. Move, produce. Images if --full. Strip if --uncss.
gulp.task("build", ["move", "images", "strip-css"]);