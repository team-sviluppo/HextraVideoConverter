/**
 * Include our app
 */
const path = require("path");
const {app, Menu, Tray, nativeImage, BrowserWindow, ipcMain } = require('electron');

const _is_devmode = false;

// browser-window creates a native window
let mainWindow = null;
// Elab window.
let elaborationWindow = null;

/**
 * Squirrel section

const args = require('./args')
const squirrel = require('./squirrel')

const cmd = args.parseArguments(app, process.argv.slice(1)).squirrelCommand
if (process.platform === 'win32' && squirrel.handleCommand(app, cmd)) {
  return
}
  */

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  createAppMenu();
});

const createWindow = () => {
  // Initialize the window to our specified dimensions
  mainWindow = new BrowserWindow({ width: 1200, height: 900, icon: path.join(__dirname, "dist", "assets", "logo.png") });

  // Tell Electron where to load the entry point from
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  _is_devmode && mainWindow.webContents.openDevTools();

  // Nascondi la finestra quando si clicca su "minimizza"
  mainWindow.on('minimize', () => {
    mainWindow.hide();
  });
  // Clear out the main window when the app is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    elaborationWindow = null;
    app.quit();
  });

  createElabWindow();
  createTray();
};

const createAppMenu = () => {
  /**
   * Windows Menu
   */
  const top_menu_template = [
    {
      label: "Utilità",
      submenu: [
        {
          label: "Aiuto",
          click() {
            require("electron").shell.openExternal("https://www.hextra.it/supporto");
          }
        },
        {
          label: "Sito Web",
          click() {
            require("electron").shell.openExternal("https://www.hextra.it");
          }
        }
      ]
    },
    {type: 'separator'},
    {
      label: "Esci",
      role: "quit",
      click() {
        mainWindow.close();
      }
    }
  ];
  /**
   * MacOSx menu
   */
  if (process.platform === 'darwin') {
    top_menu_template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: "Aiuto",
          click() {
            require("electron").shell.openExternal("https://www.hextra.it/supporto");
          }
        },
        {
          label: "Sito Web",
          click() {
            require("electron").shell.openExternal("https://www.hextra.it");
          }
        },
        {type: 'separator'},
        {
          label: "Esci",
          role: "quit",
          click() {
            mainWindow.close();
          }
        }
      ]
    });
  }

  /**
   * Creazione menu.
   */
  const menu = Menu.buildFromTemplate(top_menu_template);
  Menu.setApplicationMenu(menu);
};

const createElabWindow = () => {
  elaborationWindow = new BrowserWindow({show: false, webPreferences: { nodeIntegrationInWorker: true}});
  //elaborationWindow = new BrowserWindow({width: 500, height: 500});
  //elaborationWindow.hide();
  elaborationWindow.loadURL("file://" + __dirname + '/elab.html');
  // Open the DevTools.
  _is_devmode && elaborationWindow.webContents.openDevTools();
  // Clear out the main window when the app is closed
  elaborationWindow.on('closed', () => {
    elaborationWindow = null;
  });
}

let appIcon = null
const createTray = () => {
  let nativeimage = nativeImage.createFromPath(path.join(__dirname, "dist", "assets", "logo.png"));
  appIcon = new Tray(nativeimage);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Esci',
      type: 'normal',
      role: 'quit',
      click: () => {
        mainWindow.close();
      }
    },
    {
      label: "Aiuto",
      type: "normal",
      click: () => {
        require("electron").shell.openExternal("https://www.hextra.it/supporto");
      }
    }
  ])

  // Call this again for Linux because we modified the context menu
  appIcon.setContextMenu(contextMenu);

  // Listeners app icon.
  appIcon.on('click', () => {
    !mainWindow.isVisible() ? mainWindow.show() : undefined;
  });
};

app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Ipc Handler
 */
ipcMain.on('ping', (event, arg) => {
  _is_devmode && console.log("received ping request from thread #1");
  elaborationWindow.webContents.send("pong_test","");
  _is_devmode && console.log("sent ping request to thread #2");
});

ipcMain.on('pong_test_response', (event, arg) => {
  _is_devmode && console.log("received ping response from thread #2");
  mainWindow.webContents.send("ping_answer", arg);
  _is_devmode && console.log("sent ping response to thread #1");
});

ipcMain.on('elab_start', (event, arg) => {
  _is_devmode && console.log("received " + arg + " from thread #1");
  elaborationWindow.webContents.send("elab_server_start",arg);
  _is_devmode && console.log("sent " + arg + " to thread #2");
});

ipcMain.on('elab_server_progress', (event, arg) => {
  _is_devmode && console.log("received " + arg + " from thread #2");
  mainWindow.webContents.send("elab_progress",arg);
  _is_devmode && console.log("sent " + arg + " to thread #1");
});

ipcMain.on('elab_server_end', (event, arg) => {
  _is_devmode && console.log("received end signal " + arg + " from thread #2");
  mainWindow.webContents.send("elab_end",arg);
  _is_devmode && console.log("sent end signal " + arg + " to thread #1");
});
