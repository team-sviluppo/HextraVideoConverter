// Sample test: https://github.com/bluedaniel/Kakapo-app/blob/master/tools/installer-mac.js

import proc from 'child_process';
import mac_dev_config from './config/mac_installer.json';
import package_json from './package.json';

(() => {
  const opts = Object.assign(mac_dev_config, {
    v:      package_json.version,
    file:   'file release.'
  });

  let sync_commands = [
    `codesign --deep -v -f -s '${opts.identity}' ${opts.file}/Contents/Frameworks/*`,
    `codesign -v -f -s '${opts.identity}' ${opts.file}`,
    `codesign -vvv --display ${opts.file}`,
    `codesign -v --verify ${opts.file}`,
    'mkdir -p release',
    'chmod +x release',
    `ditto -c -k --sequesterRsrc --keepParent ${opts.file} release/${opts.name}-${opts.v}-Mac.zip`
  ];
  sync_commands.forEach((command) => {
    proc.execSync(command);
  });
})();
