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

ipcMain.handle('save-file-cli', async (event, mermaidCode, outputPath, scale, theme) => {
  // このハンドラはPNG保存専用とする
  const tempInputPath = path.join(app.getPath('temp'), `mermaid-input-${Date.now()}.mmd`);
  const mmdcPath = path.join(__dirname, 'node_modules', '.bin', 'mmdc');

  try {
    fs.writeFileSync(tempInputPath, mermaidCode);

    const mmdcCommand = `"${mmdcPath}" -i "${tempInputPath}" -o "${outputPath}" -s ${scale} -t ${theme}`;
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

// SVGコンテンツを直接保存するための新しいハンドラ
ipcMain.handle('save-svg-content', async (event, svgContent, outputPath) => {
  try {
    // juiceライブラリを使って、<style>タグをインラインstyle属性に変換
    const inlinedSvgContent = juice(svgContent);

    fs.writeFileSync(outputPath, inlinedSvgContent, 'utf8');
    console.log('SVG content inlined and saved to', outputPath);
    return { success: true };
  } catch (error) {
    console.error('Failed to save SVG content:', error);
    return { success: false, error: error.message };
  }
});
