// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// ウィンドウを作成する関数
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // レンダラープロセスとメインプロセス間の安全な通信のためにpreloadスクリプトを設定
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // アプリケーションのメインHTMLファイルを読み込む
  win.loadFile('index.html');

  // (任意) 開発者ツールを開く
  // win.webContents.openDevTools();
};

// Electronの準備が整ったらウィンドウを作成
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOSでDockアイコンがクリックされたときにウィンドウを再作成
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられたらアプリを終了
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPCハンドラ --- //

// PNG保存ダイアログを表示するハンドラ
ipcMain.handle('save-dialog', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'PNGを保存',
    defaultPath: `job_flow.png`,
    filters: [
      { name: 'PNG Images', extensions: ['png'] },
    ],
  });
  return filePath;
});

// PNGデータをファイルに保存するハンドラ
ipcMain.handle('save-png', async (event, filePath, data) => {
  try {
    // レンダラーから受け取ったバッファデータをファイルに書き込む
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    console.error('Failed to save PNG:', error);
    return { success: false, error: error.message };
  }
});
