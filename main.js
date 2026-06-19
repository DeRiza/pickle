const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 750,
    resizable: true,
    minWidth: 520,
    minHeight: 700,
    title: '数独',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('before-quit', function() {
  // Notify renderer to save game state before quitting
  var win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('save-before-quit');
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
