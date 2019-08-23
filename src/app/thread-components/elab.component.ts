import { Component, OnInit } from '@angular/core';
import { IpcRequest, IpcResponseHandler, IpcService } from '../services/ipc';
import { VideofileInfo } from '../services/videofile_info';
import * as ffmpegfluent from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

import { MPEG_PATH, PROBE_PATH } from '../env';
import { ElaborableFile } from '../classes/elaborable_file';


const FFMPEG_PATH = MPEG_PATH;
const FFPROBE_PATH = PROBE_PATH;

const OUTPUT_CONFIG = {
  video_bitrate:  "3200k",  // 5000k
  resolution:     "1280x720",
  audio_bitrate:  "160k",   // 160k
  pass2encoding:  true,
  codec_audio:    "libmp3lame",
  codec_video:    "libx264",
  aspect:         "16:9",
  audioChannels:  2
}

@Component({
  selector: 'elab-component',
  templateUrl: './elab.component.html',
  providers: [IpcService, VideofileInfo]
})
export class ElabComponent implements OnInit {
  constructor(private ipc: IpcService, private vfileInfo: VideofileInfo) {
    console.log("listening to pong_test");
    this.ipc.addResponseHandler(new IpcResponseHandler("pong_test", (event: Electron.Event, arg: string) => {
      console.log("received a pong test request.");
      this.ipc.IpcRenderer.send("pong_test_response", "pong!");
    }));

    let file_elab_start_response_handler = new IpcResponseHandler("elab_server_start", (event: Electron.Event, arg: string) => {
      let parse: {
        file: string,
        destination: string,
        videoResolution: string,
        videoFormat: string
      } = JSON.parse(arg);
      let elaborableFile: ElaborableFile = ElaborableFile.Factory(parse.file);

      let filename_without_ext = path.basename(elaborableFile.filename, path.extname(elaborableFile.filename));
      let real_filename = filename_without_ext + ".mp4";

      let destdir = parse.destination;

      console.log("destination directory and filename is: " +path.join(destdir, elaborableFile.filename));

      let cmd = ffmpegfluent(elaborableFile.filepath);
      cmd.setFfmpegPath(FFMPEG_PATH);
      cmd.setFfprobePath(FFPROBE_PATH);

      let video_bitrate;

      let prom = new Promise((resolve, reject) => {
        this.vfileInfo.isFileBiggerThan(elaborableFile.filepath, 50).then((isBigger) => {
          if (isBigger) {
            this.vfileInfo.isFileBiggerThan(elaborableFile.filepath, 100).then((isBiggerThan100) => {
              if (isBiggerThan100) {
                this.vfileInfo.calculateBitrateFromOutputSize(elaborableFile.filepath, 50).then((res: number) => {
                  video_bitrate = res;
                  console.log("selected bitrate for " + elaborableFile.filepath + "  -- " + video_bitrate);
                  resolve();
                });
              }
              else {
                this.vfileInfo.calculateBitrateFromOutputSize(elaborableFile.filepath, 38).then((res: number) => {
                  video_bitrate = res;
                  console.log("selected bitrate for " + elaborableFile.filepath + "  -- " + video_bitrate);
                  resolve();
                });
              }
            });
          } else {
            vfileInfo.getFileBitrate(elaborableFile.filepath).then((bitr) => {
              video_bitrate = bitr > 3200 ? 3200 : bitr;
              console.log("selected bitrate for " + elaborableFile.filepath + "  -- " + video_bitrate);
              resolve();
            });
          }
        });
      });

      prom.then(() => {
        cmd
        .size(elaborableFile.FileData.UseOriginalResolution ? elaborableFile.FileData.getResolutionString() : parse.videoResolution)
        .keepDAR()
        .toFormat("mp4")
        .aspect(parse.videoFormat)
        .videoBitrate(elaborableFile.FileData.Video_Bitrate / 1000)
        .audioBitrate(elaborableFile.FileData.Audio_Bitrate / 1000)
        //.audioCodec(elaborableFile.FileData.Audio_Codec)
        //.videoCodec(elaborableFile.FileData.Video_Codec)
        //.audioChannels(OUTPUT_CONFIG.audioChannels)
        .autopad(true, 'black')

        cmd.on('start', () => {
          console.log("converting process started");
        }).on('progress', (info) => {
            this.ipc.IpcRenderer.send("elab_server_progress", info.percent === undefined ? "" : info.percent);
        }).on('stderr', (stderrLine: string) => {
            //console.log("Stderr output: " + stderrLine);
        }).on('error', (err, stdout, stderr) => {
            console.log('Cannot process video: ' + err.message);
        }).on('end', (stdout, stderr) => {
            this.ipc.IpcRenderer.send("elab_server_end", "");
        }).save(path.join(destdir, real_filename));
      });
    });
    this.ipc.addResponseHandler(file_elab_start_response_handler);
  }

  ngOnInit() { }
}
