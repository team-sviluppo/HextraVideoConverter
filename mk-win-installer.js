/**
 * Use the following command to generate a private key:
 * makecert -sv hextra_video_converter_private-key.pvk -n "CN=HextravideoconverterCertificate" HextraVideoConverter_CERTIFICATE.cer -b 01/07/2017 -e 01/07/2027 -r
 * pvk2pfx -pvk my_private_key.pvk -spc my_test_certificate.cer -pfx my_signing_key.pfx -po my_password
 * (use the Developer Command Prompt for Visual Studio to generate one).
 * Keep the password somewhere.
 *
 * For this project, the password is Hextra#17!
 *
 * Remember that you will need to windows SDK tools, in this case we need the ones of windows 10:
 * https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk
 *
 * Also, remember to run:
 *
 * npm install -g electron-installer-windows
 */

let installer = require("electron-installer-windows");

var options = {
  src: './release/win32-all/app-win32-x64/',
  dest: './release/win32-all/app-win32-x64-installer/',
  icon: './config/icons/logo.ico',
  tags: [
    "Utility"
  ],
  certificateFile: "./config/private_keys/hextra_video_converter_signing_key.pfx",
  certificatePassword: "Hextra#17!",
  authors: ['HextraSRL'],
  description: "Convertitore video per wordpress.",
  productDescription: "Convertitore video da utilizzare per unificare il formato di output per wordpress."
};

console.log("Creating package installer for win32-x64 -- this may take a while.");

installer(options, (err) => {
  if (err) {
    console.log(err, err.stack);
    process.exit(1);
  }
  else {

  }
  console.log("Successfully created the install package at : " + options.dest);
});
