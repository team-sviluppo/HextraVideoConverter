"use strict";

let colors = require("colors");

console.log("****************************".green);
console.log("* Initializing generation  *".green);
console.log("****************************".green);

let packager = require('electron-packager');
const pkg = require('./package.json');
const argv = require('minimist')(process.argv.slice(2));
const devDeps = Object.keys(pkg.devDependencies);

const appName = argv.name || pkg.productName;
const shouldUseAsar = argv.asar || false;
const shouldBuildAll = argv.all || false;
const arch = argv.arch || 'all';
const platform = argv.platform || 'darwin';
const { exec } = require('child_process');

console.log("Selected platform is: " + platform.red.underline);
console.log("Application name is: " + appName.red.underline);

const DEFAULT_OPTS = {
    dir: './src/app',
    name: appName,
    asar: shouldUseAsar,
    appCopyright: "Hextra SRL",
    appVersion: pkg.version,
    win32metadata: {
      CompanyName:  "Hextra SRL",
      FileDescription: "Hextra Video Converter",
      ProductName:  "Hextra Video Converter",
      InternalName: "Hextra Video Converter"
    },
    ignore: [
    ].concat(devDeps.map(name => `/node_modules/${name}($|/)`)),
    icon: "./config/icons/logo" // Format will be injected later!
};

pack(platform, arch, function done(err, appPath) {
    if (err != null) {
      console.log(err.red);
    }
    else {
      console.log("Successfully generated the package!".green);
      console.log("About to clean useless data from packages".red.underline);
      exec("npm run clean-afterbuild", (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          return;
        }

        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      });
    }
});

function pack(plat, arch, cb) {
    // there is no darwin ia32 electron
    if (plat === 'darwin' && arch === 'ia32') return;

    const iconObj = {
        icon: DEFAULT_OPTS.icon + (() => {
            let extension = '.png';
            if (plat === 'darwin') {
                extension = '.icns';
            } else if (plat === 'win32') {
                extension = '.ico';
            }
            return extension;
        })()
    };

    const opts = Object.assign({}, DEFAULT_OPTS, iconObj, {
        platform: plat,
        arch,
        overwrite: true,
        prune: true,
        all: shouldBuildAll,
        out: `release/${plat}-${arch}`
    });

    console.log("-----------------------------".bgGreen);
    console.log("-Packaging: ".bgGreen + plat.blue.bgGreen + "-".bgGreen + arch.blue.bgGreen + "-".white.bgGreen);
    console.log("-----------------------------".bgGreen);

    packager(opts, cb);
}
