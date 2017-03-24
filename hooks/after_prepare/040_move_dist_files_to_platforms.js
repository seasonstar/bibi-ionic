#!/usr/bin/env node

/**
 * After prepare, files are copied to the platforms/[platform] folder.
 * Lets clean up some of those files that arent needed with this hook.
 */
var path = require('path');
var mv = require('mv');

var rootdir = process.argv[2];


if (rootdir) {

  // list of files and folders to move from www/dist to www/
  var toMove = ['dist_css', 'dist_js', 'index.html'];

  // go through each of the platform directories that have been prepared
  var platforms = (process.env.CORDOVA_PLATFORMS ? process.env.CORDOVA_PLATFORMS.split(',') : []);

  for (var x=0; x<platforms.length; x++) {
    // open up the index.html file at the www root
    try {
      var platform = platforms[x].trim().toLowerCase();
      var wwwPath, distPath;

      if (platform == 'android') {
        wwwPath = path.join('platforms', platform, 'assets', 'www');
      } else {
        wwwPath = path.join('platforms', platform, 'www');
      }
      distPath = path.join(wwwPath, 'dist');

      process.stdout.write('Moving dist files to '+ platform +' platform...\n');

      for (var i=0; i<toMove.length; ++i) {
        var what = toMove[i];
        var from = path.join(distPath, what);
        var to = path.join(wwwPath, what);

        mv(from, to, {mkdirp: true}, (function(what, from, to) {
          return function(err) {
            if (typeof err !== 'undefined') {
              console.log('!! ERROR when moving "'+ what +'" to '+ platform +' platform');
              console.log('\tMoving from: "'+ from +'" to "'+ to + '"');
              console.log(err);
            } else {
              console.log('\tMoved "'+ what +'".');
            }
          };
        })(what, from, to));

      }
    } catch(e) {
      process.stdout.write(e);
    }
  }

}
