const path = require('path');
const { app, screen, BrowserWindow, nativeTheme } = require('electron');
const isDev = require('electron-is-dev');
const { setUpIpcMain } = require(path.join(__dirname, '/database-main.js'));

function createWindow() {
  const systemScaleFactor = screen.getPrimaryDisplay().scaleFactor;
  console.log('scaleFactor', systemScaleFactor);
  const customScale = systemScaleFactor > 1 ? .75/systemScaleFactor : systemScaleFactor;
  console.log('computedZoom', customScale);
  // Create the browser window.
  const win = new BrowserWindow({
    ...(nativeTheme.shouldUseDarkColors ? { backgroundColor: 'black' } : {}),
    show: false,
    width: 1450,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '/database-renderer.js'),
      nodeIntegration: true,
    }
  });

  const resetProperScale = () => {
    win.webContents.setZoomFactor(customScale);
  }

  // and load the index.html of the app.
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, 'index.html'));
  }
  // Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.once('ready-to-show', () => {
    resetProperScale();
    win.show();
  });

  win.on('focus', () => {
    resetProperScale();
    win.webContents.send('focus');
  });

  win.on('blur', () => {
    resetProperScale();
    win.webContents.send('blur');
  });

  win.on('maximize', resetProperScale);
  win.on('unmaximize', resetProperScale);
  win.on('minimize', resetProperScale);
  win.on('restore', resetProperScale);
  win.on('resized', resetProperScale);
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
