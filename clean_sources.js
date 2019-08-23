/**
 * Cleans the typescript stuff from the standalone directory.
 */
let colors = require("colors");
const outputs_defaults = require('./config/output.defaults.json');
const path = require("path");
const fs = require("fs");
const fs_plus = require("fs-plus");

let clean_dir = path.join(...outputs_defaults.outputPath.windows);

/**
 * Removes typescript files.
 */
let filesList = [];

function loopDir(directory) {
  fs_plus.traverseTreeSync(directory, (file) => {
    filesList.push(file);
  }, (dir) => {
    loopDir(dir);
  });
}
loopDir(clean_dir);

let renderString = "";
renderString += "**************************\n".gray;
renderString += "Removing typescript files.\n".gray;
renderString += "**************************\n".gray;
console.log(renderString);


filesList = filesList.filter(name => {
  let match = /(.*)\.ts$/.test(name);
  return match;
}).forEach((filename) => {
  fs.unlink(filename, (err) => {
    if (err) {
      console.log("ERROR while trying to remove file " + filename + ", err is: " + err.message.red);
    }
    else {
      console.log("removed file: " + filename.toString().red.bgBlue);
    }
  });
});
