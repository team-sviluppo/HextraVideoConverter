/**
 * In this file you may want to edit the constant "output mode".
 * If you need to work on the development and testing using:
 * npm run build && npm run electron
 * set the constant to mode.debug.
 * Alternatively, use mode.production.
 * @Author: Hextra SRL
 */

import * as path from 'path';
import * as os from 'os';

const mode = {
  debug: 0,
  production: 1
};

console.log("process.env.production is: " + process.env.production);

const env_mode = process.env.production ? mode.production : mode.debug;

const output_mode = env_mode;

let native_dir;
let FFMPEG_PATH;
let FFPROBE_PATH;

if (output_mode === mode.debug) {
  native_dir = path.join(process.cwd(), "src", "native");
  FFMPEG_PATH;
  FFPROBE_PATH;

  if (os.platform() === 'win32') {
    FFMPEG_PATH = path.join(native_dir, "ffmpeg_dir/ffmpeg-20170711-0780ad9-win64-static/bin/ffmpeg.exe");
    FFPROBE_PATH = path.join(native_dir, "ffmpeg_dir/ffmpeg-20170711-0780ad9-win64-static/bin/ffprobe.exe");
  }
  else if (os.platform() === 'darwin') {
    FFMPEG_PATH = path.join(native_dir, "Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_15.05.2017/ffmpeg");
    FFPROBE_PATH = path.join(native_dir, "Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_15.05.2017/ffprobe");
  }
}
else {
  native_dir = path.join(process.cwd(), "resources", "app", "dist", "native");
  FFMPEG_PATH;
  FFPROBE_PATH;

  if (os.platform() === 'win32') {
    FFMPEG_PATH = path.join(native_dir, "ffmpeg_dir/ffmpeg-20170711-0780ad9-win64-static/bin/ffmpeg.exe");
    FFPROBE_PATH = path.join(native_dir, "ffmpeg_dir/ffmpeg-20170711-0780ad9-win64-static/bin/ffprobe.exe");
  }
  else if (os.platform() === 'darwin') {
    FFMPEG_PATH = path.join(native_dir, "Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_15.05.2017/ffmpeg");
    FFPROBE_PATH = path.join(native_dir, "Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_15.05.2017/ffprobe");
  }
}

export const PROBE_PATH = FFPROBE_PATH;
export const MPEG_PATH = FFMPEG_PATH;
