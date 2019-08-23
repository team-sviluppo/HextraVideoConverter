import { CodecsCollection } from './codecs_collection';
import { Codec } from './codec';
import { ElaborationType, _PICTURES_PER_VIDEO } from '../components/home/home.component';
import { NgZone } from '@angular/core';
import { VideofileInfo } from '../services/videofile_info';
import * as path from 'path';
import * as ffmpegfluent from 'fluent-ffmpeg';
import * as fs from 'fs';

export class ElaborableFileData {
  public Audio_Codec: string;
  public Video_Codec: string;

  public Audio_Bitrate: number;
  public Video_Bitrate: number;

  public Video_Width: number;
  public Video_Height: number;

  public aspect_ratio: string;

  public UseOriginalResolution: boolean = false;

  /**
   * Default constructor.
   * @param {*} [stream] Stream object to pass or null.
   * @memberof ElaborableFileData
   *
   */
  constructor(stream?: any) {
    console.log("stream is:");
    console.log(stream);
    if (stream) {
      console.log("joined if.");
      let video, audio;
      if(stream[0].codec_type === "audio") {
        audio = stream[0];
        video = stream[1];
      }
      else {
        audio = stream[1];
        video = stream[0];
      }

      console.log("video is:");
      console.log(video);
      console.log("audio is:");
      console.log(audio);

      this.Video_Codec = video.codec_name;
      this.Audio_Codec = audio.codec_name;
      this.Video_Bitrate = video.bit_rate;
      this.Audio_Bitrate = audio.bit_rate;
      this.Video_Width = video.coded_width || "n.d.";
      this.Video_Height = video.coded_height || "n.d.";
      this.aspect_ratio = video.display_aspect_ratio || "n.d.";
    }
  }

  public getResolutionString(): string {
    return `${this.Video_Width}x${this.Video_Height}`;
  }

  public getAudioCodec(codecsCollReference: CodecsCollection): Codec {
    return codecsCollReference.findByQuery(codec => codec.isAudio && codec.codecName === this.Audio_Codec);
  }

  public getVideoCodec(codecsCollReference: CodecsCollection): Codec {
    return codecsCollReference.findByQuery(codec => codec.isVideo && codec.codecName === this.Audio_Codec);
  }

  /**
   * Returns a new ElaborableFileData from a parseable data source.
   *
   * @static
   * @param {string} jsonString
   * @returns {ElaborableFileData}
   * @memberof ElaborableFileData
   *
   */
  public static Factory(jsonString: string): ElaborableFileData {
    let input = JSON.parse(jsonString);
    let res = new ElaborableFileData();

    res.Video_Codec = input.Video_Codec;
    res.Audio_Codec = input.Audio_Codec;
    res.Video_Bitrate = input.Video_Bitrate;
    res.Audio_Bitrate = input.Audio_Bitrate;
    res.Video_Width = input.Video_Width;
    res.Video_Height = input.Video_Height;
    res.aspect_ratio = input.aspect_ratio;
    res.UseOriginalResolution = input.UseOriginalResolution;
    return res;
  }

  /**
   *
   * Exports.
   *
   * @returns {string}
   * @memberof ElaborableFileData
   */
  public ToString(): string {
    let obj = {
      Video_Codec:  this.Video_Codec,
      Audio_Codec:  this.Audio_Codec,
      Video_Bitrate: this.Video_Bitrate,
      Audio_Bitrate: this.Audio_Bitrate,
      Video_Width:  this.Video_Width,
      Video_Height: this.Video_Height,
      aspect_ratio: this.aspect_ratio,
      UseOriginalResolution: this.UseOriginalResolution,
    };
    return JSON.stringify(obj);
  }
}

export class ElaborableFile {
  public filename: string = "";
  public filepath: string = "";
  public filetype: string = "";
  public FileData: ElaborableFileData;
  public group_format: string = "";
  public size: string = "";
  public elaborate: boolean = true;

  public in_elaboration: boolean = false;
  public elaboration_done: boolean = false;
  public elaboration_type: ElaborationType = ElaborationType.PROGRESS_INDETERMINATE;
  public elaboration_progress: number = 0;
  public outputFileName: string = "";

  public screenshots_paths: string[] = [];
  public selected_screenshot: number = 0;
  public amount: number = _PICTURES_PER_VIDEO;
  public loading_random_picutres: boolean = false;
  public fileInputChanged: boolean = false;
  public generatingOtherPictures: boolean = false;

  private zoneReference: NgZone;
  private videoFileInfoReference: VideofileInfo;

  constructor(private el?: ffmpegfluent.FfprobeData) {
    if (el) {
      this.FileData = new ElaborableFileData(el['streams']);
      this.filepath = el.format.filename;
      let splitted = this.filepath.split("\\");
      this.filename = splitted[splitted.length - 1];

      this.filetype = el.format.format_long_name;
      this.group_format = el.format.format_name;
      this.size = +el.format.size / 1000000 + "Mb";
    }
  }

  /**
   * Factory
   *
   * @static
   * @param {string} json
   * @memberof ElaborableFile

   *
   */
  public static Factory(json: string): ElaborableFile {
    let p = JSON.parse(json);
    let temp = new ElaborableFile();
    temp.filename = p.filename;
    temp.filepath = p.filepath;
    temp.FileData = ElaborableFileData.Factory(p.fileData);
    return temp;
  }

  /**
   * Exports.
   *
   * @returns {string}
   * @memberof ElaborableFile
   */
  public ToString(): string {
    let obj = {
      filepath: this.filepath,
      filename: this.filename,
      fileData: this.FileData.ToString()
    };
    return JSON.stringify(obj);
  }

  /**
   * Changes the selected screenshot.
   *
   * @param {number} selected
   * @memberof ElaborableFile
   */
  public changeSelectedImage(selected: number) {
    console.log("selected is:");
    console.log(selected);
    this.selected_screenshot = selected;
  }

  /**
   * Call per la view per generare altri screenshots.
   */
  public generateOthers() {
    this.generatingOtherPictures = true;
    if (this.amount > 0) {
      this.getRandomScreenshots(this.amount, this.videoFileInfoReference, this.zoneReference).then((r) => {
        this.fileInputChanged = false;
        this.generatingOtherPictures = false;
      });
    }
  }

  /**
   * Cattura N screenshots casuali.
   *
   * @memberof ElaborableFile
   */
  public getRandomScreenshots(amount: number, videoServiceReference: VideofileInfo, zoneReference?: NgZone): Promise<boolean> {
    this.videoFileInfoReference = videoServiceReference;
    this.zoneReference = zoneReference;
    if (zoneReference) {
      zoneReference.run(() => {
        this.loading_random_picutres = true;
      });
    }
    else {
      this.loading_random_picutres = true;
    }
    return new Promise((resolve, reject) => {
      /**
       * Rimuovi le immagini esistenti, se ce ne sono.
       */
      if (this.screenshots_paths.length > 0) {
        let looper = (current, max) => {
          if (current >= max) {
            this.retrieveScreenshots(amount, videoServiceReference, zoneReference).then(() => {
              resolve(true);
            });
          }
          else {
            fs.unlink(this.screenshots_paths[current], (err) => {
              looper(current + 1, max);
            });
          }
        };
        looper(0, this.screenshots_paths.length);
      }
      else {
        this.retrieveScreenshots(amount, videoServiceReference, zoneReference).then(() => {
          resolve(true);
        });
      }
    });

  }

  private retrieveScreenshots(amount: number, videoServiceReference: VideofileInfo, zoneReference?: NgZone): Promise<boolean> {
    return new Promise((resolve, reject) => {
      videoServiceReference.getRandomPictures(this.filepath, amount).then((res: string[]) => {
        console.log("screenshots generati.");
        console.log(res);
        this.screenshots_paths = res;
        if (zoneReference) {
          zoneReference.run(() => {
            this.loading_random_picutres = false;
          });
        }
        else {
          this.loading_random_picutres = false;
        }
        resolve(true);
      });
    });
  }

  get ElaborationProgress(): number {
    return +this.elaboration_progress;
  }

  get IsIndeterminate(): boolean {
    return this.elaboration_type === ElaborationType.PROGRESS_INDETERMINATE;
  }
}
