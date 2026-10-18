import { join } from "node:path";
import { BrowserWindow, shell } from "electron";

const isDev = !!process.env["ELECTRON_RENDERER_URL"];

// The renderer makes no network calls; everything goes through the preload API.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: membetter-media:",
  "media-src 'self' blob: membetter-media:",
  `style-src 'self'${isDev ? " 'unsafe-inline'" : ""}`,
  "script-src 'self'",
  "connect-src 'self'" + (isDev ? " ws://localhost:* http://localhost:*" : ""),
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 480,
    show: false,
    title: "MemBetter",
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  // The app never needs camera, microphone, location or notifications.
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [isDev ? csp.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'") : csp],
      },
    });
  });

  // Never open or navigate to anything outside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    const dev = process.env["ELECTRON_RENDERER_URL"];
    if (!(dev && url.startsWith(dev))) event.preventDefault();
  });

  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devUrl) void win.loadURL(devUrl);
  else void win.loadFile(join(__dirname, "../renderer/index.html"));
  return win;
}
