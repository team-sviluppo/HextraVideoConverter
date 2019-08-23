/**
 * Import decorators and services from angular
 */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';

/*
 * App Component
 * Top Level Component
 */
@Component({
    // The selector is what angular internally uses
    selector: 'elab-app',
    encapsulation: ViewEncapsulation.None,
    template: `
    <div>
        <elab-component></elab-component>
    </div>
    `
})
export class WrapperComponent  {
    constructor() {

    }
}
