import { Component, OnInit, ViewChild, Output, EventEmitter, NgZone } from '@angular/core';
import * as fs_plus from 'fs-plus';
import * as fs from 'fs';

class FilePreviewCollection {
  public coll: FilePreview[] = [];

  constructor() {

  }

  /**
   * Merges the public .coll FilePreview array with the provided collection's .coll array.
   *
   * @param {FilePreviewCollection} newColl
   * @memberof FilePreviewCollection
   *
   */
  public MergeCollection(newColl: FilePreviewCollection) {
    newColl.coll.forEach((e: FilePreview) => {
      let exists = this.coll.find(elem => elem.filepath === e.filepath);
      !exists && this.coll.push(e);
    });
  }

  /**
   * Returns an array of strings of all the compatible files available.
   *
   * @returns {string[]}
   * @memberof FilePreviewCollection
   *
   */
  public getCompatibleFilepathsList(): string[] {
    return this.coll.filter( e => e.isCompatible ).map( e => e.filepath );
  }

  /**
   * Removes an item from the collection.
   *
   * @param {FilePreview} item
   * @memberof FilePreviewCollection
   *
   */
  public removeItem(item: FilePreview): void {
    this.coll.splice(this.coll.indexOf(item), 1);
  }

  get Total(): number {
    return this.coll.length;
  }

  get Uncompatibles(): number {
    return this.coll.filter((e) => {
     return e.isCompatible === false;
    }).length;
  }

  get Compatibles(): number {
    return this.coll.filter((e) => {
     return e.isCompatible === true;
    }).length;
  }

  public Add (fp: FilePreview) {
    this.coll.push(fp);
  }

  public Empty() {
    this.coll = [];
  }
}

class FilePreview {
  constructor(public filepath: string, public isCompatible: boolean) {

  }
}

@Component({
  selector: 'filedrop',
  templateUrl: './filedrop.component.html',
  styleUrls: ['./filedrop.component.scss']
})
export class FileDropComponent implements OnInit {
  @Output('onFileDropped') onFileDropped: EventEmitter<Array<string>> = new EventEmitter();
  // File Loading progress
  public loadingFiles: boolean = false;
  public loadingFilesProgress: number = 0;
  public loadingFilesMax: number = 0;

  public buttonVisibile: boolean = false;

  /**
   * Gestisce il risultato dell'output.
   *
   * @private
   * @type {string[]}
   * @memberof FileDropComponent

   *
   */
  private res: string[] = [];

  /**
   * Stabilisce se il drag è in corso.
   *
   * @type {boolean}
   * @memberof FileDropComponent
   */
  public draggedOver: boolean = false;

  public _dragOverPreviews: FilePreviewCollection;
  public previews: FilePreviewCollection;

  constructor() {
    this._dragOverPreviews = new FilePreviewCollection();
    this.previews = new FilePreviewCollection();
  }

  public onDragStart($event) {
    $event.preventDefault();

    let files: FileList = $event.dataTransfer.files;
    if (files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        let f: File = files.item(i);
        this._dragOverPreviews.Add(new FilePreview(f.path, this.isFileCompatible(f.path)));
      }
    }
    this.draggedOver = true;
  }


  public onDragLeave($event) {
    this._dragOverPreviews = new FilePreviewCollection();
    this.draggedOver = false;
  }

  public onDrop($event) {
    $event.preventDefault();
    let files: FileList = $event.dataTransfer.files;

    let _temp_collection = new FilePreviewCollection();

    if (files.length > 0) {
      this.loadingFiles = true;
      this.loadingFilesProgress = 0;
      this.loadingFilesMax = files.length;

      let prom = new Promise((resolve, reject) => {
        let async_loop = ((i, max) => {
          if (i >= max) {
            resolve();
          }
          else {
            let f: File = files.item(i);
            let path = f.path;
            fs_plus.isDirectory(path, (isDir) => {
              if (isDir) {
                let files: string[] = [];
                this.loopDir(path, (file: string) => {
                  this.loadingFilesMax += 1;
                  console.log("file is: " + file);
                  _temp_collection.Add(new FilePreview(file, this.isFileCompatible(file)));
                  this.loadingFilesProgress += 1;
                }, () => {
                  console.log("done!... looping moar!");
                  async_loop(i + 1, max);
                });
              }
              else {
                console.log("path is: " + path);
                this.loadingFilesProgress += 1;
                _temp_collection.Add(new FilePreview(path, this.isFileCompatible(path)));
                async_loop(i + 1, max);
              }
            });
          }
        });
        async_loop(0, files.length);
      });
      prom.then((done) => {
        this.loadingFiles = false;
        this.previews.MergeCollection(_temp_collection);

        if (this.previews.getCompatibleFilepathsList().length > 0) {
          this.buttonVisibile = true;
          this.res = this.previews.getCompatibleFilepathsList();
        }
        else {
          this.buttonVisibile = false;
          this.draggedOver = false;
        }
        this.onDragLeave.call(this, $event);
      });
    }
    else {
      this.onDragLeave.call(this, $event);
    }
  }

  /**
   * Lista formati accettati dal filedrop.
   *
   * @private
   * @memberof FileDropComponent
   *
   */
  private accepted_formats = [
    '.flv',
    '.f4v',
    '.f4p',
    '.f4a',
    '.f4b',
    '.mov',
    '.mp4',
    '.m4p',
    '.3gp',
    '.3g2',
    '.m4v',
    '.mpg',
    '.mpeg',
    '.mp2',
    '.mpe',
    '.mpv',
    '.m4v',
    '.vmw',
    '.avi',
    '.qt',
    '.ogg',
    '.ogv',
    '.flv',
    '.webm'
  ];
  /**
   * Filtra i files indesiderati.
   * Idealmente bisognerebbe usare una regex, ma per ora va bene così.
   * @private
   * @memberof FileDropComponent
   *
   */
  private fileFilter(arg: string[]) {
    return arg.filter((elem: string) => {
      return this.accepted_formats.some((acceptedString: string) => {
        return elem.indexOf(acceptedString) > -1;
      });
    });
  }

  /**
   * Verifica se il file passato (tramite filepath) è compatibile con i formati accettati.
   *
   * @private
   * @param {string} filepath
   * @returns
   * @memberof FileDropComponent
   *
   */
  private isFileCompatible(filepath: string) {
    return this.accepted_formats.some((acceptedString: string) => {
      return filepath.indexOf(acceptedString) > -1;
    });
  }

  /**
   * Emette i dati tramite il fab button in fondo a destra.
   *
   * @memberof FileDropComponent
   *
   */
  public EmitData() {
    this.onFileDropped.emit(this.res);
  }

  /**
   * Loops a directory and handles any file found with the second argument (pass an anonymous function expecting a file: any param).
   *
   * @private
   * @param {string} directory
   * @param {(file: any) => void} onFile
   * @memberof FileDropComponent
   */
  private loopDir(directory: string, onFile: (file: string) => void, onDone: () => void) {
    fs_plus.traverseTree(directory, (file) => {
      onFile(file);
    }, (dir) => {
      console.log("dir found, looping: " + dir);
      this.loopDir(dir, onFile, onDone);
    }, () => {
      // Done!
      console.log("done!");
      onDone();
    });
  }

  ngOnInit() {

  }
}
