/**
 * Import decorators and services from angular
 */
import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { Wizard, WizardPage } from 'clarity-angular';
import { FormControl, FormGroup } from '@angular/forms';
import { remote } from 'electron';
import * as fs from 'fs';

/**
 * Import the ngrx configured store
 */
import { Store } from '@ngrx/store';

import * as path from 'path';
import * as ffmpegfluent from 'fluent-ffmpeg';

// Importa il servizio per le notifiche.
import { NotificationsService } from '../../services/notifications';
import { IpcService, IpcRequest, IpcResponseHandler } from '../../services/ipc';
import { VideofileInfo, FFMPEGInfo } from '../../services/videofile_info';
import { Codec } from '../../classes/codec';
import { CodecsCollection } from '../../classes/codecs_collection';
import { ElaborableFile } from '../../classes/elaborable_file';
import { VideoResolution, DefaultAspects, DefaultVideoResolution, VideoResolutionAspect, VideoResolutionCollection } from '../../classes/resolutions';

export const _PICTURES_PER_VIDEO = 10;

export enum ElaborationType {
  PROGRESS_DETERMINATE = 0,
  PROGRESS_INDETERMINATE = 1
}

export enum WIZARD_STATUSES {
  SELECT_DIR = 0,
  ELABORATE = 1,
  THUMBNAILS = 2,
  END = 3
}

@Component({
  selector: 'ae-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [NotificationsService, IpcService, VideofileInfo, FFMPEGInfo]
})
export class HomeComponent implements OnInit {
  public opened: boolean = false;
  public filesDropped: ElaborableFile[] = [];
  public AudioCodecsList: Codec[];
  public VideoCodecsList: Codec[];

  // Aspects list and selected aspect.
  public AspectsList: VideoResolutionAspect[] = DefaultAspects;
  // Selected (and) default resolution.
  public SelectedResolution: VideoResolution = DefaultVideoResolution;

  /**
   * Wizard stuff
   */
  public wizard_status = 0;

  public wizardElaborationStarted: boolean = false;
  public outputDir: string = undefined;

  @ViewChild("elabWizard") elabWizard: Wizard;
  public openWizard: boolean = false;
  private remote: Electron.Remote;

  constructor(private notifications: NotificationsService, private ipc: IpcService, private vfileInfo: VideofileInfo, private zone: NgZone, public ffmpeginfo: FFMPEGInfo) {
    this.remote = remote;

    let ready_sub = this.ffmpeginfo.OnReady.subscribe((next) => {
      if (next) {
        this.AudioCodecsList = this.ffmpeginfo.CodecsColl.getAudioCodecs();
        this.VideoCodecsList = this.ffmpeginfo.CodecsColl.getVideoCodecs();
        ready_sub.unsubscribe();
      }
    });
  }

  private isWindowHidden() {
    let currWindow = this.remote.getCurrentWindow();
    console.log("isWindowHidden is returning: " + currWindow.isMinimized());
    return currWindow.isMinimized();
  }

  public pingTest(): void {
    console.log("sending ping test request");
    this.ipc.addCycle("test", new IpcRequest("ping", ""), new IpcResponseHandler("ping_answer", (event: Electron.Event, arg: string) => {
      console.log("servidor answered: " + arg);
    }));
    this.ipc.startCycle("test");
  }

  public onFileDropped(filesList: Array<string>) {
    this.filesDropped = [];
    filesList.forEach((f: string) => {
      this.vfileInfo.GetFileInfo(f).then((res: ffmpegfluent.FfprobeData) => {
        this.filesDropped.push(new ElaborableFile(res));
      });
    });
  }

  public openWizardProcess() {
    this.openWizard = true;
  }

  public beginElaboration() {
    console.log("beginning elaborations");
    this.wizardElaborationStarted = true;

    this.filesDropped = this.filesDropped.filter((e) => {
      return e.elaborate === true;
    });

    // Async ordered loop.
    let async_loop = (current, max) => {
      if (current >= max) {
        this.zone.run(() => {
          this.wizardElaborationStarted = false;
        });
      }
      else {
        this.filesDropped[current].in_elaboration = true;
        let async_request = new IpcRequest("elab_start", JSON.stringify({
          file:  this.filesDropped[current].ToString(),
          destination: this.outputDir,
          videoResolution: this.SelectedResolution.GetFormatString(),
          videoFormat:  this.SelectedResolution.format.GetFormatString()
        }));
        let async_progress = new IpcResponseHandler("elab_progress", (event: Electron.Event, arg: string) => {
          //console.log("received : " + arg);
          if (arg === "") {
            //console.log("progress bar stays indeterminate");
            //this.filesDropped[current].elaboration_type = ElaborationType.PROGRESS_INDETERMINATE;
          }
          else {
            this.zone.run(() => {
              this.filesDropped[current].elaboration_type = ElaborationType.PROGRESS_DETERMINATE;
              this.filesDropped[current].elaboration_progress = +arg;
            });
          }
        });
        let async_end = new IpcResponseHandler("elab_end", (event: Electron.Event, arg: string) => {
          console.log("got signal end");
          this.zone.run(() => {
            this.filesDropped[current].in_elaboration = false;
            this.filesDropped[current].elaboration_done = true;
          });

          this.filesDropped[current].outputFileName = this.outputDir + this.filesDropped[current].filename;
          // Get random screenshots, then continue.
          this.filesDropped[current].getRandomScreenshots(_PICTURES_PER_VIDEO, this.vfileInfo, this.zone).then(() => {
            /*
              Notifica
            */
            if (this.isWindowHidden()) {
              this.notifications.Notify("Conversione", `il video ${this.filesDropped[current].filename} è stato convertito!`);
            }
            async_loop(current + 1, max);
          });
        });
        this.ipc.startAsyncCycle(async_request, async_progress, async_end);
      }
    };
    async_loop(0, this.filesDropped.length);
  }

  public selectDirectory(event) {
    //console.log(event);
    let path = event.target.files[0].path;
    if (path != undefined) {
      this.outputDir = path;
      // start elab.
      //this.beginElaboration();
    }
  }

  public onWizardPageChanged() {
    if (this.openWizard) {
      console.log("increasing");
      this.wizard_status++;

      // check status
      if (this.wizard_status === WIZARD_STATUSES.ELABORATE) {
        this.beginElaboration();
      }
      else if (this.wizard_status === WIZARD_STATUSES.THUMBNAILS) {
        console.log("THUMBNAILZ.");
      }
    }
  }

  public finalModalOpened: boolean = false;
  public finalModalCloseEnabled: boolean = false;
  public final_save_progress: number = 0;
  public onWizardEnd() {
    // Trascrivi i files.
    this.finalModalOpened = true;
    this.final_save_progress = 0;

    let looper = () => {
      if (this.final_save_progress >= this.filesDropped.length) {
        this.finalModalCloseEnabled = true;
        require("child_process").exec('start "" "'+this.outputDir+'"');
      }
      else {
        console.log("current final save progress is:");
        console.log(this.final_save_progress);
        // Seleziona il file
        let f = this.filesDropped[this.final_save_progress];
        // Elabora filename.
        let selected_screenshot = f.screenshots_paths[f.selected_screenshot];
        let screenshot_extension = path.extname(selected_screenshot); // png.
        let output_basename = path.basename(f.filename, path.extname(f.filename)); // nomevideo (senza estensione)
        let output_path = path.join(this.outputDir, output_basename + screenshot_extension);
        // Write
        console.log("selected_screenshot is: " +selected_screenshot);
        console.log("output path is: " + output_path);
        let file_stream = fs.createReadStream(selected_screenshot).pipe(fs.createWriteStream(output_path));
        file_stream.on('finish', () => {
          console.log("writing finished");
          this.zone.run(() => {
            this.final_save_progress += 1;
          });
          looper();
        });
      }
    };
    looper();
  }

  /**
   * ripristina.
   */
  public restore() {
    // Just reload the window.
    remote.getCurrentWindow().reload();
  }

  ngOnInit() {

  }
}
