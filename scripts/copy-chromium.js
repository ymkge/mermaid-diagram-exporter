const fs = require('fs-extra');
const path = require('path');

const sourceDir = path.join(__dirname, '../node_modules/@sparticuz/chromium/bin');
const destDir = path.join(__dirname, '../lib/mmdc-bin/chromium'); // lib/mmdc-bin の中に chromium ディレクトリを作成

console.log(`Copying Chromium files from ${sourceDir} to ${destDir}`);

fs.ensureDir(destDir)
  .then(() => fs.copy(sourceDir, destDir))
  .then(() => console.log('Chromium files copied successfully!'))
  .catch(err => console.error('Error copying Chromium files:', err));
