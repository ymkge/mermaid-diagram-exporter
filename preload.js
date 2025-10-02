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
   * メインプロセスにPNGデータの保存を要求する (Canvasベースの旧方式)
   * @param {string} filePath - 保存先のファイルパス
   * @param {Uint8Array} data - 保存するPNGデータのUint8Array
   * @returns {Promise<{success: boolean, error?: string}>} 保存結果
   */
  savePng: (filePath, data) => ipcRenderer.invoke('save-png', filePath, data),

  /**
   * mermaid-cliを使ってPNGデータの保存を要求する
   * @param {string} mermaidCode - Mermaidのコード
   * @param {string} outputPath - 保存先のファイルパス
   * @param {number} width - 出力画像の幅
   * @param {number} height - 出力画像の高さ
   * @param {number} scale - 出力画像のスケール
   * @param {string} theme - Mermaidのテーマ (e.g., 'default', 'dark')
   * @returns {Promise<{success: boolean, error?: string, stderr?: string}>} 保存結果
   */
  savePngCli: (mermaidCode, outputPath, width, height, scale, theme) => 
    ipcRenderer.invoke('save-png-cli', mermaidCode, outputPath, width, height, scale, theme),
});
