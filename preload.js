const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  saveDialog: () => ipcRenderer.invoke('save-dialog'),

  saveFileCli: (mermaidCode, outputPath, scale, theme) => 
    ipcRenderer.invoke('save-file-cli', mermaidCode, outputPath, scale, theme),

  saveSvgContent: (svgContent, outputPath) =>
    ipcRenderer.invoke('save-svg-content', svgContent, outputPath),
});
