// Electron main process. No screens are duplicated here.
//
// With a web URL, the window loads the hosted staff web app. Desktop users then get each
// web deploy without a new installer. Rebuild desktop only when this shell changes.
// Without a web URL, the window loads the bundled copy in renderer/ (apps/web/dist).
//
// The web URL comes from the WEB_URL environment variable, or from "webUrl" in package.json,
// which release.yml sets from DESKTOP_WEB_URL at packaging time.
const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const { webUrl: packagedWebUrl } = require("./package.json");

const webUrl = process.env.WEB_URL || packagedWebUrl || "";

function openOutside(url) {
  if (/^https?:\/\//.test(url)) shell.openExternal(url);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      // The hosted web app reads its API URL from its own config.js. Only the bundled
      // copy needs the preload script to set it.
      additionalArguments: webUrl ? [] : ["--release-lab-bundled"],
    },
  });

  // Links to other sites open in the browser, not in this window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: "deny" };
  });

  if (!webUrl) {
    window.loadFile(path.join(__dirname, "renderer", "index.html"));
    return;
  }

  const origin = new URL(webUrl).origin;
  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== origin) {
      event.preventDefault();
      openOutside(url);
    }
  });
  window.webContents.on("did-fail-load", (_event, _code, description, _url, isMainFrame) => {
    if (!isMainFrame) return;
    const message = `Could not reach ${webUrl} (${description}). Check your connection, then reopen the app.`;
    window.loadURL(`data:text/plain;charset=utf-8,${encodeURIComponent(message)}`);
  });
  window.loadURL(webUrl);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
