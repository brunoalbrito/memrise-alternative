import { contextBridge, ipcRenderer } from "electron";
import type { MembetterApi } from "../shared/api";

const api: MembetterApi = {
  app: {
    info: () => ipcRenderer.invoke("app:info"),
  },
  media: {
    put: (id, bytes, name) => ipcRenderer.invoke("media:put", { id, bytes, name }),
    remove: (id) => ipcRenderer.invoke("media:remove", { id }),
  },
  library: {
    load: () => ipcRenderer.invoke("library:load"),
    apply: (change) => ipcRenderer.invoke("library:apply", change),
  },
};

contextBridge.exposeInMainWorld("api", api);
