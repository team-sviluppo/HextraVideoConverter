import { Injectable } from '@angular/core';
import * as path from 'path';
import * as fs from 'fs';

// Notifications API di electron.
declare var Notification: any;

/**
 * Include electron browser so that a new windows can be triggered for auth
 * Information about browserWindow on electron
 * https://github.com/electron/electron/blob/master/docs/api/browser-window.md
 */
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;

@Injectable()
export class NotificationsService {
  private NotificationsApi;
  private _icon: string;

  constructor() {
    this.NotificationsApi = Notification;
    let p = path.join(process.cwd(), "src", "assets", "logo.png");
    fs.readFile(p, (err, data) => {
      if (!err) {
        console.log("file seems to exist");
        this._icon = p;
      }
    });
  }

  /**
   * Notify.
   * Crea una notifica nativa in base all'OS.
   * @params
   * -  Titolo: string
   * -  Messaggio: string
   * -  Immagine?: string (url)
   */
  public Notify(titolo: string, messaggio: string, immagine?: string): boolean {
    let message = {
      title: titolo,
      body: messaggio,
      icon: immagine ? immagine : this._icon !== undefined ? this._icon : ""
    };
    new this.NotificationsApi(message.title, message);
    return true;
  }
}
