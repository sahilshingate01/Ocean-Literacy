/**
 * Ocean Literacy Desktop Application - Main Process
 * Handles application lifecycle, window management, system tray, and secure IPC handlers.
 */

const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

// 1. Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// 2. Storage File Path in User Data Directory
const storageFilePath = path.join(app.getPath('userData'), 'ocean_data.json');

function readUserData() {
  try {
    if (fs.existsSync(storageFilePath)) {
      const raw = fs.readFileSync(storageFilePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading ocean user data:', err);
  }
  return { bookmarks: [], notes: {}, quizHistory: [], settings: {} };
}

function writeUserData(data) {
  try {
    fs.writeFileSync(storageFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing ocean user data:', err);
    return false;
  }
}

// 3. Create Main Desktop Window
function createMainWindow() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    title: 'Ocean Literacy',
    icon: iconPath,
    backgroundColor: '#050B14',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'win32', // custom or native titlebar support
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      devTools: true
    },
    show: false
  });

  const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Intercept navigation to prevent opening external links inside app window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

// 4. Create Native Application Menu
function createApplicationMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: 'About Ocean Literacy' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide Ocean Literacy' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit Ocean Literacy' }
      ]
    }] : []),
    {
      label: 'Explore',
      submenu: [
        {
          label: 'Ocean Missions (Play)',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('ocean:navigate', 'missions')
        },
        {
          label: '7 Ocean Principles',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.send('ocean:navigate', 'principles')
        },
        {
          label: 'Depth Zones Simulator',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.send('ocean:navigate', 'depth')
        },
        {
          label: 'Marine Life Encyclopedia',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.send('ocean:navigate', 'marine')
        },
        {
          label: 'Climate & Ocean Currents',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow?.webContents.send('ocean:navigate', 'climate')
        },
        {
          label: 'Conservation & Threats Tracker',
          accelerator: 'CmdOrCtrl+5',
          click: () => mainWindow?.webContents.send('ocean:navigate', 'conservation')
        },
        {
          label: 'Ocean Knowledge Assessment',
          accelerator: 'CmdOrCtrl+6',
          click: () => mainWindow?.webContents.send('ocean:navigate', 'quiz')
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Ocean Literacy Official Framework',
          click: async () => {
            await shell.openExternal('https://oceanliteracy.unesco.org/');
          }
        },
        {
          label: 'Project GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/sahilshingate01/Ocean-Literacy');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 5. System Tray Icon Setup
function createSystemTray() {
  const trayIconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'tray-icon.png');
  if (!fs.existsSync(trayIconPath)) return;

  try {
    tray = new Tray(trayIconPath);
    tray.setToolTip('Ocean Literacy Desktop');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Ocean Literacy',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createMainWindow();
          }
        }
      },
      {
        label: 'Play Ocean Missions',
        click: () => {
          if (!mainWindow) createMainWindow();
          mainWindow.show();
          mainWindow.webContents.send('ocean:navigate', 'missions');
        }
      },
      {
        label: 'Start Ocean Quiz',
        click: () => {
          if (!mainWindow) createMainWindow();
          mainWindow.show();
          mainWindow.webContents.send('ocean:navigate', 'quiz');
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus();
        } else {
          mainWindow.show();
        }
      }
    });
  } catch (err) {
    console.warn('System tray initialization skipped:', err.message);
  }
}

// 6. IPC Handlers
function setupIpcHandlers() {
  ipcMain.handle('ocean:get-app-info', () => {
    return {
      name: app.name,
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      userDataPath: app.getPath('userData')
    };
  });

  ipcMain.handle('ocean:load-data', () => {
    return readUserData();
  });

  ipcMain.handle('ocean:save-data', (event, data) => {
    return writeUserData(data);
  });

  ipcMain.handle('ocean:open-external', async (event, url) => {
    if (url && (url.startsWith('https:') || url.startsWith('http:'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  ipcMain.handle('ocean:save-file-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || 'Save Ocean Document',
      defaultPath: options.defaultPath || 'ocean-certificate.png',
      filters: options.filters || [{ name: 'Images', extensions: ['png', 'jpg'] }]
    });
    return result;
  });

  ipcMain.handle('ocean:write-file', async (event, filePath, base64Content) => {
    try {
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(filePath, buffer);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.on('ocean:window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('ocean:window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
  });

  ipcMain.on('ocean:window-close', () => {
    if (mainWindow) mainWindow.close();
  });
}

// 7. App Lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createMainWindow();
  createApplicationMenu();
  createSystemTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
