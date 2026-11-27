const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktopApp: true,
  platform: process.platform,
  toggleWidget: () => ipcRenderer.invoke('calanderq:toggle-widget'),
});
