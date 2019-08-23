/**
 * Elaboration Thread application.
 *
 * This is just one of many ways to force node to spawn an additional thread to make calculations.
 * In this case, this application is just serving as an hidden thread that performs the video convertion.
 *
 * The whole communication happens through the electron's IPC channel, check main.js to find the communication protocol.
 *
 * The components that belongs to this Angular 2 application are in the thread-components folder.
 * @Author: Hextra SRL
 */

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

import { WrapperComponent } from './thread-components/wrapper.component';
import { ElabComponent } from './thread-components/elab.component';

/*
 * provide('AppStore', { useValue: appStore }),
 */
@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        BrowserAnimationsModule
        //StoreModule.provideStore({ authStore }, { authStore: authInitialState }),
    ],
    providers: [],
    declarations: [WrapperComponent, ElabComponent],
    bootstrap: [WrapperComponent]
})
export class ElabModule { }
platformBrowserDynamic().bootstrapModule(ElabModule);
