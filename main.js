// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process'); // child_processモジュールを追加

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

// PNGデータをファイルに保存するハンドラ (Canvasベースの旧方式、今回は使用しないが残しておく)
ipcMain.handle('save-png', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    console.error('Failed to save PNG:', error);
    return { success: false, error: error.message };
  }
});

// mermaid-cliを使ってPNGを生成するハンドラ
ipcMain.handle('save-png-cli', async (event, mermaidCode, outputPath, width, height, scale, theme) => {
  const tempInputPath = path.join(app.getPath('temp'), `mermaid-input-${Date.now()}.mmd`);

  try {
    // Mermaidコードを一時ファイルに書き込む
    fs.writeFileSync(tempInputPath, mermaidCode);

    // mmdcコマンドを構築
    // -i: 入力ファイル, -o: 出力ファイル, -w: 幅, -H: 高さ, -s: スケール, -t: テーマ
    const mmdcCommand = `npx mmdc -i "${tempInputPath}" -o "${outputPath}" -w ${width} -H ${height} -s ${scale} -t ${theme}`;

    console.log(`Executing: ${mmdcCommand}`);

    return new Promise((resolve, reject) => {
      exec(mmdcCommand, (error, stdout, stderr) => {
        // 一時ファイルを削除
        fs.unlinkSync(tempInputPath);

        if (error) {
          console.error(`mmdc exec error: ${error}`);
          console.error(`mmdc stderr: ${stderr}`);
          reject({ success: false, error: error.message, stderr: stderr });
          return;
        }
        console.log(`mmdc stdout: ${stdout}`);
        resolve({ success: true });
      });
    });
  } catch (error) {
    console.error('Failed to save PNG via mmdc:', error);
    // 一時ファイルが存在すれば削除を試みる
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    return { success: false, error: error.message };
  }
});
