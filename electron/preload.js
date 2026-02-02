const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // ... existing apis ...
    onUpdateLog: (callback) => ipcRenderer.on('update-log', (_event, value) => callback(value)),
    // ... existing apis ...
    setZoomFactor: (factor) => webFrame.setZoomFactor(factor),
    getZoomFactor: () => webFrame.getZoomFactor(),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, callback) => {
        const subscription = (_event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
    }
});
