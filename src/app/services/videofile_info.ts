import * as ffmpegfluent from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
// Spawn used to ask ffmpeg stuff.
import { exec } from 'child_process';

import { Injectable } from '@angular/core';
import { CodecsCollection } from '../classes/codecs_collection';

import { MPEG_PATH, PROBE_PATH } from '../env';
import { Observable } from 'rxjs';

const FFMPEG_PATH = MPEG_PATH;
const FFPROBE_PATH = PROBE_PATH;

console.log("paths are:");
console.log(FFMPEG_PATH);
console.log(FFPROBE_PATH);

/**
 * Handler directory temporanea.
 */
const TMP_DIR = path.join(process.cwd(), "tmp");
@Injectable()
export class FFMPEGInfo {
  public CodecsColl: CodecsCollection;
  public OnReady: Observable<boolean>;

  constructor() {
    this.OnReady = new Observable((observer) => {
      this.getCodecsList().then((ready) => {
        observer.next(ready);
      });
    });
  }

  public getCodecsList(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const subprocess = exec(`${FFMPEG_PATH} -codecs`, (error: Error, stdout: string, stderr: string) => {
        if (error) {
          console.log("ERROR :" + error.message);
          resolve(false);
        }
        else {
          //console.log("stdout : ");
          //console.log(stdout);
          let coll = new CodecsCollection(stdout);
          this.CodecsColl = coll;
          resolve(true);
          //console.log("stderr : ");
          //onsole.log(stderr);
        }
      });
    });
  }
}


@Injectable()
export class VideofileInfo {
  constructor() {

  }

  public getRandomPictures(filepath: string, amount: number): Promise<string[]> {
    let filenameArray = filepath.split("\\");
    let filename = filenameArray[filenameArray.length - 1];
    let res: string[] = [];

    return new Promise((resolve, reject) => {
      ffmpegfluent(filepath)
      .on('filenames', (filenames) => {
        res = filenames.map((e) => {
          e = path.join(TMP_DIR, e);
          return e;
        });
      }).on('end', () => {
        resolve(res);
      }).screenshots({
        count: amount,
        folder: TMP_DIR,
        filename: `${filename}__at__%s__seconds.png`
      });
    });
  }

  public GetFileInfo(filepath: string): Promise<ffmpegfluent.FfprobeData> {
    let fileinfo = ffmpegfluent(filepath);
    fileinfo.setFfmpegPath(FFMPEG_PATH);
    fileinfo.setFfprobePath(FFPROBE_PATH);

    return new Promise((resolve, reject) => {
      fileinfo.ffprobe((err, data: ffmpegfluent.FfprobeData) => {
          if (err) {
            reject(err);
          }
          else {
            resolve(data);
          }
      });
    });
  }

  /**
   * Returns true if the video filepath size in Mb is bigger than the provided size in Mb.
   * @param {string} filepath
   * @param {number} size
   * @returns {Promise<boolean>}
   * @memberof VideofileInfo
   *
   */
  public isFileBiggerThan(filepath: string, size: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.GetFileInfo(filepath).then((res) => {
        if (res.format.size / 1000 / 1000 > size ) {
          resolve(true);
        }
        else {
          resolve(false);
        }
      });
    });
  }

  /**
   * Calculates a fair bitrate according to a fixed file dimension (output) expressed in Mb.
   *
   * @param {string} filepath
   * @param {number} size
   * @returns {Promise<number>}
   * @memberof VideofileInfo
   *
   */
  public calculateBitrateFromOutputSize(filepath: string, size: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.GetFileInfo(filepath).then((res) => {
        let bitrate = Math.round(size * 1000 * 8 / res.format.duration);
        resolve(bitrate);
      });
    });
  }

  /**
   * Returns the bitrate of the file.
   *
   * @param {string} filepath
   * @returns {Promise<number>}
   * @memberof VideofileInfo
   *
   */
  public getFileBitrate(filepath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.GetFileInfo(filepath).then((res) => {
        console.log("res is: ");
        console.log(res);
        let bitrate = res.format.bit_rate;
        resolve(bitrate);
      });
    });
  }
}
