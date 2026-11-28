const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const fs = require('fs');
const http = require('http');
const path = require('path');

let mainWindow = null;
let tray = null;
let staticServer = null;
let serverUrl = process.env.CALENDAR_Q_URL || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startEmbeddedDistServer() {
  if (serverUrl) return Promise.resolve(serverUrl);
  const distDir = path.join(__dirname, '..', 'dist');

  return new Promise((resolve) => {
    staticServer = http.createServer((req, res) => {
      const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');

      const relPath = decodeURIComponent(reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname).replace(/^\/+/, '');
      let filePath = path.join(distDir, relPath);
      if (!filePath.startsWith(distDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    staticServer.listen(0, '127.0.0.1', () => {
      const addr = staticServer.address();
      serverUrl = `http://127.0.0.1:${addr.port}`;
      resolve(serverUrl);
    });
  });
}

function getAppIconPath() {
  const packagedIcon = path.join(__dirname, '..', 'dist', 'android-chrome-512x512.png');
  if (fs.existsSync(packagedIcon)) return packagedIcon;
  return path.join(__dirname, '..', 'public', 'android-chrome-512x512.png');
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Calander.Q',
    icon: getAppIconPath(),
    backgroundColor: '#0A0908',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`${serverUrl}/?open=calendar`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startEmbeddedDistServer();
  createMainWindow();

  try {
    const icon = nativeImage.createFromPath(getAppIconPath()).resize({ width: 16, height: 16 });
    tray = new Tray(icon);
    tray.setToolTip('Calander.Q');
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Open Calander.Q', click: () => (mainWindow ? mainWindow.show() : createMainWindow()) },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
      ])
    );
  } catch {
    // Tray optional if icon unavailable
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (staticServer) {
    try {
      staticServer.close();
    } catch {
      // ignore
    }
  }
  if (process.platform !== 'darwin') app.quit();
});
