#!/usr/bin/env node

/**
 * After prepare, files are copied to the platforms/[platform] folder.
 * Lets clean up some of those files that arent needed with this hook.
 */
var fs = require('fs');
var path = require('path');

var rootdir = process.argv[2];

var deleteFolderRecursive = function(removePath) {
  if( fs.existsSync(removePath) ) {
    fs.readdirSync(removePath).forEach(function(file,index){
      var curPath = path.join(removePath, file);
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(removePath);
  }
};

if (rootdir) {

  // list of dev folders to delete from platform folder
  var foldersToDelete = ['css', 'js', 'lib', 'templates', 'dist/dist_js/app'];

  // go through each of the platform directories that have been prepared
  var platforms = (process.env.CORDOVA_PLATFORMS ? process.env.CORDOVA_PLATFORMS.split(',') : []);

  for (var x=0; x<platforms.length; x++) {
    // open up the index.html file at the www root
    try {
      var platform = platforms[x].trim().toLowerCase();
      var wwwPath;

      if (platform == 'android') {
        wwwPath = path.join('platforms', platform, 'assets', 'www');
      } else {
        wwwPath = path.join('platforms', platform, 'www');
      }

      for (var i=0; i<foldersToDelete.length; ++i) {
        var folder = foldersToDelete[i];
        var pathToDelete = path.join(wwwPath, folder);

        if (fs.existsSync(pathToDelete)) {
          process.stdout.write('removing "'+ folder +'" folder: ' + pathToDelete + '\n');
          deleteFolderRecursive(pathToDelete);
        }
      }
    } catch(e) {
      process.stdout.write(e);
    }
  }

}
