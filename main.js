const { app, BrowserWindow, ipcMain } = require("electron");

try {
  require("electron-reloader")(module, { ignore: ["src"] });
} catch {}

require("electron-store").initRenderer();

require("electron-context-menu")();

const windows = {
  main: {
    file: "mainForm.html",
    instance: undefined,
  },
  keywords: {
    file: "keywordsForm.html",
    instnace: undefined,
  },
};

function createWindow(name) {
  if (windows[name].instance) return;

  const window = new BrowserWindow({
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });

  window.loadFile(windows[name].file);

  windows[name].instance = window;

  window.on("closed", () => {
    windows[name].instance = undefined;
  });
}

app.on("ready", () => createWindow("main"));
ipcMain.on("open-keywords", () => createWindow("keywords"));
