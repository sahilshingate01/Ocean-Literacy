/**
 * Ocean Literacy Desktop Application - Preload Script
 * Exposes a secure, context-isolated bridge between Renderer and Main processes.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('oceanAPI', {
  isElectron: true,

  // App Metadata & Telemetry
  getAppInfo: () => ipcRenderer.invoke('ocean:get-app-info'),

  // Persistence Storage
  loadUserData: () => ipcRenderer.invoke('ocean:load-data'),
  saveUserData: (data) => ipcRenderer.invoke('ocean:save-data', data),

  // Native Dialogs & File Operations
  saveFileDialog: (options) => ipcRenderer.invoke('ocean:save-file-dialog', options),
  writeFile: (filePath, base64Content) => ipcRenderer.invoke('ocean:write-file', filePath, base64Content),
  openExternal: (url) => ipcRenderer.invoke('ocean:open-external', url),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('ocean:window-minimize'),
  maximizeWindow: () => ipcRenderer.send('ocean:window-maximize'),
  closeWindow: () => ipcRenderer.send('ocean:window-close'),

  // Navigation Listener from Native Menu
  onNavigate: (callback) => {
    const handler = (event, viewId) => callback(viewId);
    ipcRenderer.on('ocean:navigate', handler);
    return () => ipcRenderer.removeListener('ocean:navigate', handler);
  }
});
