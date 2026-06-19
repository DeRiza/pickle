const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onSaveBeforeQuit: function(callback) {
    ipcRenderer.on('save-before-quit', callback);
  }
});
