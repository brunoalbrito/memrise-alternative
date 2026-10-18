import { contextBridge, ipcRenderer, webUtils } from "electron";
import type { MembetterApi } from "../shared/api";

const api: MembetterApi = {
  app: {
    info: () => ipcRenderer.invoke("app:info"),
  },
  media: {
    put: (id, bytes, name) => ipcRenderer.invoke("media:put", { id, bytes, name }),
    remove: (id) => ipcRenderer.invoke("media:remove", { id }),
  },
  exchange: {
    exportItems: (items) => ipcRenderer.invoke("exchange:export", { items }),
    pickFile: () => ipcRenderer.invoke("exchange:pickFile"),
    inspect: (path) => ipcRenderer.invoke("exchange:inspect", { path }),
    commit: (token, choice) => ipcRenderer.invoke("exchange:commit", { token, choice }),
    pathForFile: (file) => webUtils.getPathForFile(file),
    onOpenFile: (callback) => {
      const listener = (_event: unknown, path: string) => callback(path);
      ipcRenderer.on("exchange:open-file", listener);
      // Tell main the listener exists so a file opened at startup is delivered.
      ipcRenderer.send("exchange:ready");
      return () => ipcRenderer.removeListener("exchange:open-file", listener);
    },
    onProgress: (callback) => {
      const listener = (_event: unknown, done: number, total: number) => callback(done, total);
      ipcRenderer.on("exchange:progress", listener);
      return () => ipcRenderer.removeListener("exchange:progress", listener);
    },
  },
  ai: {
    status: () => ipcRenderer.invoke("ai:status"),
    saveKey: (provider, key) => ipcRenderer.invoke("ai:saveKey", { provider, key }),
    removeKey: (provider) => ipcRenderer.invoke("ai:removeKey", { provider }),
    testGoogle: () => ipcRenderer.invoke("ai:testGoogle"),
    setModels: (models) => ipcRenderer.invoke("ai:setModels", models),
    restoreModels: () => ipcRenderer.invoke("ai:restoreModels"),
    wordText: (word, languageName) => ipcRenderer.invoke("ai:wordText", { word, languageName }),
    wordAudio: (word) => ipcRenderer.invoke("ai:wordAudio", { word }),
    wordImage: (word, sentence) => ipcRenderer.invoke("ai:wordImage", { word, sentence }),
  },
  library: {
    load: () => ipcRenderer.invoke("library:load"),
    apply: (change) => ipcRenderer.invoke("library:apply", change),
  },
};

contextBridge.exposeInMainWorld("api", api);
