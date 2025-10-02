// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// レンダラープロセスの `window` オブジェクトに安全なAPIを公開する
contextBridge.exposeInMainWorld('api', {
  /**
   * メインプロセスにPNG保存ダイアログの表示を要求する
   * @returns {Promise<string | undefined>} ユーザーが選択したファイルパス
   */
  saveDialog: () => ipcRenderer.invoke('save-dialog'),

  /**
   * メインプロセスにPNGデータの保存を要求する
   * @param {string} filePath - 保存先のファイルパス
   * @param {Buffer} data - 保存するPNGデータのバッファ
   * @returns {Promise<{success: boolean, error?: string}>} 保存結果
   */
  savePng: (filePath, data) => ipcRenderer.invoke('save-png', filePath, data),
});
