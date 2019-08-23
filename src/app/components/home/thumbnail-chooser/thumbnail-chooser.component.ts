import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import * as fs from 'fs';

class ThumbnailFile {
  public canBeShown: boolean = false;
  public sanitized_path: SafeUrl = "";

  constructor(public filepath: string, sanitizerReference: DomSanitizer) {
    let subscription = this.FileExists().subscribe((r: boolean) => {
      if (r) {
        this.canBeShown = true;
        subscription.unsubscribe();
        this.sanitized_path = sanitizerReference.bypassSecurityTrustUrl(this.filepath);
        console.log("image : " + filepath + " now exists!");
      }
    });
  }

  public FileExists(): Observable<boolean> {
    return new Observable(observer => {
      setInterval(() => {
        // Checks whether the file exists.
        fs.readFile(this.filepath, (err, data) => {
          if (err) {
            observer.next(false);
          }
          else {
            observer.next(true);
          }
        });
      }, 2000);
    });
  }
}

@Component({
  selector: 'thumbnail-chooser',
  templateUrl: './thumbnail-chooser.component.html',
  styleUrls: ['./thumbnail-chooser.component.scss']
})
export class ThumbnailChooserComponent implements OnInit, OnChanges {
  @Input('sourcefiles') sourcefiles: string[];
  @Output('onImageSelected') onImageSelected: EventEmitter<number> = new EventEmitter();
  public selectedImage: number = 0;
  public fileslist: ThumbnailFile[] = [];

  constructor(private sanitizer: DomSanitizer) {

  }

  ngOnChanges(changes: any) {
    console.log("refreshing files list.")
    this.fileslist = [];
    this.sourcefiles.forEach((e: string) => {
      this.fileslist.push(new ThumbnailFile(e, this.sanitizer));
    });
  }

  /**
   * Handles image selection.
   * This will also emit the onImageSelected event that can be handled on the parent to easily know what image has been selected.
   * @param {string} img
   * @memberof ThumbnailChooserComponent
   *
   */
  public selectImage(img: string) {
    this.selectedImage = this.sourcefiles.indexOf(img);
    this.onImageSelected.emit(this.selectedImage);
  }

  ngOnInit() {
    this.sourcefiles = this.sourcefiles || [];
    this.fileslist = [];
    this.sourcefiles.forEach((e: string) => {
      this.fileslist.push(new ThumbnailFile(e, this.sanitizer));
    });
  }
}
