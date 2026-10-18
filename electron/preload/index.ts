import { contextBridge, ipcRenderer } from "electron";
import type { MembetterApi } from "../shared/api";

const api: MembetterApi = {
  app: {
    info: () => ipcRenderer.invoke("app:info"),
  },
};

contextBridge.exposeInMainWorld("api", api);
