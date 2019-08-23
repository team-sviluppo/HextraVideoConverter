import { Injectable } from '@angular/core';
import * as ipc from 'electron';

export class IpcRequest {
  constructor(public request: string, public argument: string) {

  }
}

export class IpcResponseHandler {
  constructor (public response_msg: string, public handler: (event: Electron.Event, arg: string) => void) {

  }
}

class IpcCycle {
  constructor(public name: string, private ipcReference: Electron.IpcRenderer, private request: IpcRequest, private responseHandler: IpcResponseHandler) {
    this.ipcReference.once(responseHandler.response_msg, responseHandler.handler);
  }

  public start() {
    this.ipcReference.send(this.request.request, this.request.argument);
  }
}

@Injectable()
export class IpcService {
  public IpcRenderer: Electron.IpcRenderer;
  public Cycles: Array<IpcCycle> = [];


  constructor() {
    this.IpcRenderer = ipc.ipcRenderer;
  }

  public addResponseHandler (ipcResponse: IpcResponseHandler) {
    this.IpcRenderer.on(ipcResponse.response_msg, ipcResponse.handler);
  }

  public addCycle(cycleName: string, ipcReq: IpcRequest, ipcResponse: IpcResponseHandler): void {
    this.Cycles.push(new IpcCycle(cycleName, this.IpcRenderer, ipcReq, ipcResponse));
  }

  public startAsyncCycle(ipcReq: IpcRequest, ipcProgress: IpcResponseHandler, ipcEnd: IpcResponseHandler) {
    // send request
    this.IpcRenderer.send(ipcReq.request, ipcReq.argument);
    // set progress handler.
    this.IpcRenderer.on(ipcProgress.response_msg, ipcProgress.handler);
    // set end handler.
    this.IpcRenderer.on(ipcEnd.response_msg, (event: Electron.Event, arg: string) => {
      // call end listener and remove.
      this.IpcRenderer.removeAllListeners(ipcProgress.response_msg);
      this.IpcRenderer.removeAllListeners(ipcEnd.response_msg);
      ipcEnd.handler.call(this, event, arg);
    });
  }

  public startCycle(cycleName: string) {
    let cycle = this.Cycles.find((arg: IpcCycle) => {
      return arg.name === cycleName;
    });
    if (cycle !== undefined) {
      cycle.start();
    }
    else {
      console.warn("Couldn't find cycle " + cycleName);
    }
  }
}
