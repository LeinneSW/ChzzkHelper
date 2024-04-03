import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('api', {
    alert: (message: string, title?: string) => {
        ipcRenderer.send('alert', message, title)
    }
});