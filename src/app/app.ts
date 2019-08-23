import * as path from 'path';
import * as fs from 'fs';

/*
 * Angular Modules
 */
import { enableProdMode, NgModule, Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Setup redux with ngrx
import { Store, StoreModule } from '@ngrx/store';

/**
 * Import our child components
 */
import { HomeComponent } from './components/home/home.component';
import { ThumbnailChooserComponent } from './components/home/thumbnail-chooser/thumbnail-chooser.component';
import { AppComponent } from './components/app.component';
import { FileDropComponent } from './components/filedrop/filedrop.component';

/**
 * Import material UI Components
 */
import { ClarityModule } from "clarity-angular";

import { routes } from './app.routes';

/**
 *
 * Clean directory temporanea
 */
const TMP_DIR = path.join(process.cwd(), "tmp");
let rmDir = function(dirPath, removeSelf) {
  if (removeSelf === undefined)
    removeSelf = true;
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath, removeSelf);
    }
  if (removeSelf)
    fs.rmdirSync(dirPath);
};
fs.exists(TMP_DIR, (exists) => {
  if (exists) {
    rmDir(TMP_DIR, false);
  }
  else {
    fs.mkdir(TMP_DIR);
  }
});

/*
 * provide('AppStore', { useValue: appStore }),
 */
@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        ClarityModule.forRoot(),
        BrowserAnimationsModule,
        RouterModule.forRoot(routes, { useHash: true }),
        //StoreModule.provideStore({ authStore }, { authStore: authInitialState }),
    ],
    providers: [],
    declarations: [AppComponent, HomeComponent, FileDropComponent, ThumbnailChooserComponent],
    bootstrap: [AppComponent]
})
export class AppModule { }
platformBrowserDynamic().bootstrapModule(AppModule);
