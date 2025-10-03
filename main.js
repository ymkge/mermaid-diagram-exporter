const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const juice = require('juice');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPCハンドラ --- //

ipcMain.handle('save-dialog', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: '画像を保存',
    defaultPath: `job_flow.png`,
    filters: [
      { name: 'PNG Images', extensions: ['png'] },
      { name: 'SVG Images', extensions: ['svg'] },
    ],
  });
  return filePath;
});

/**
 * PNG形式で画像を保存するハンドラ。
 * mermaid-cli (mmdc) を外部コマンドとして呼び出して実行する。
 */
ipcMain.handle('save-file-cli', async (event, mermaidCode, outputPath, scale, theme) => {
  const tempInputPath = path.join(app.getPath('temp'), `mermaid-input-${Date.now()}.mmd`);
  const mmdcPath = path.join(__dirname, 'node_modules', '.bin', 'mmdc');

  try {
    fs.writeFileSync(tempInputPath, mermaidCode);

    // 日本語フォントなどを指定した設定ファイルを読み込む
    const configPath = path.join(__dirname, 'mmdc-config.json');
    const mmdcCommand = `"${mmdcPath}" -i "${tempInputPath}" -o "${outputPath}" -s ${scale} -t ${theme} -c "${configPath}"`;
    
    console.log(`Executing: ${mmdcCommand}`);

    return new Promise((resolve, reject) => {
      exec(mmdcCommand, (error, stdout, stderr) => {
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
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    return { success: false, error: error.message };
  }
});

/**
 * SVG形式で画像を保存するハンドラ。
 * mmdcが生成するSVGは一部サービス（Google Driveなど）との互換性が低いため、
 * レンダラープロセス（フロントエンド）で生成されたSVGコンテンツを直接受け取り、ファイルに書き込む。
 */
ipcMain.handle('save-svg-content', async (event, svgContent, outputPath) => {
  try {
    // juiceライブラリを使い、<style>タグをインラインstyle属性に変換する。
    // これにより、SVGの互換性が向上する（ただし、Google Driveでは依然として問題が残る場合がある）。
    const inlinedSvgContent = juice(svgContent);

    fs.writeFileSync(outputPath, inlinedSvgContent, 'utf8');
    console.log('SVG content inlined and saved to', outputPath);
    return { success: true };
  } catch (error) {
    console.error('Failed to save SVG content:', error);
    return { success: false, error: error.message };
  }
});