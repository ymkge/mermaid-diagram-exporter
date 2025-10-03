const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

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

ipcMain.handle('save-file-cli', async (event, mermaidCode, outputPath, scale, theme) => {
  const tempInputPath = path.join(app.getPath('temp'), `mermaid-input-${Date.now()}.mmd`);
  const mmdcPath = path.join(__dirname, 'node_modules', '.bin', 'mmdc');

  try {
    fs.writeFileSync(tempInputPath, mermaidCode);

    // 出力パスの拡張子に応じてコマンドを調整
    const isSvg = path.extname(outputPath).toLowerCase() === '.svg';
    let mmdcCommand;
    if (isSvg) {
      // SVGの場合はscaleオプションが不要（または意図しない結果になる可能性）なため除外
      mmdcCommand = `"${mmdcPath}" -i "${tempInputPath}" -o "${outputPath}" -t ${theme}`;
    } else {
      mmdcCommand = `"${mmdcPath}" -i "${tempInputPath}" -o "${outputPath}" -s ${scale} -t ${theme}`;
    }

    console.log(`Executing: ${mmdcCommand}`);

    return new Promise((resolve, reject) => {
      exec(mmdcCommand, (error, stdout, stderr) => {
        if (error) {
          fs.unlinkSync(tempInputPath);
          console.error(`mmdc exec error: ${error}`);
          console.error(`mmdc stderr: ${stderr}`);
          reject({ success: false, error: error.message, stderr: stderr });
          return;
        }

        // SVGファイルの場合、Googleスプレッドシートで読み込めるように最適化する
        if (isSvg) {
          try {
            let svgContent = fs.readFileSync(outputPath, 'utf8');
            // XML宣言とDOCTYPE宣言を削除
            svgContent = svgContent.replace(/<\?xml[^>]*\?>\s*/, '');
            svgContent = svgContent.replace(/<!DOCTYPE[^>]*>\s*/, '');
            fs.writeFileSync(outputPath, svgContent, 'utf8');
            console.log('Cleaned SVG file for Google Sheets compatibility.');
          } catch (cleanError) {
            console.error('Could not clean SVG file:', cleanError);
            // クリーンアップに失敗しても、元のファイルは保存されているので、そのまま続行
          }
        }

        fs.unlinkSync(tempInputPath);
        console.log(`mmdc stdout: ${stdout}`);
        resolve({ success: true });
      });
    });
  } catch (error) {
    console.error('Failed to save file via mmdc:', error);
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    return { success: false, error: error.message };
  }
});
