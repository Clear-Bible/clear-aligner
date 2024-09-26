/**
 * This is the starting point for the entire Electron app and is executed in
 * the node.js process.
 */
import path from 'path';
import { app, screen, BrowserWindow, nativeTheme } from 'electron';
import isDev from 'electron-is-dev';
import { setUpIpcMain } from './database-main'

function createWindow() {
  const systemScaleFactor = screen.getPrimaryDisplay().scaleFactor;
  const customScale = systemScaleFactor > 1 ? .75/systemScaleFactor : systemScaleFactor;

  // Create the browser window.
  const win = new BrowserWindow({
    ...(nativeTheme.shouldUseDarkColors ? { backgroundColor: 'black' } : {}),
    show: false,
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../src/electron/assets/icons/transparent_icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '/database-renderer.js'),
      nodeIntegration: true,
      zoomFactor: customScale
    }
  });

  // allow links to external sites to be opened outside the Electron
  win.webContents.setWindowOpenHandler(() => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        fullscreen: false,
        width: 550,
        height: 700,
        autoHideMenuBar: true,
    }
  }});

  // and load the index.html of the app.
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../../ui/index.html'));
  }
  // Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('focus', () => {
    win.webContents.send('focus');
  });

  win.on('blur', () => {
    win.webContents.send('blur');
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  setUpIpcMain();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
