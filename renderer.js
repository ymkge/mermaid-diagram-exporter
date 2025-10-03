// renderer.js

import mermaid from './node_modules/mermaid/dist/mermaid.esm.min.mjs';

// --- DOM要素の取得 --- //
const mermaidCodeEl = document.getElementById('mermaid-code');
const previewEl = document.getElementById('preview');
const renderBtn = document.getElementById('render-btn');
const saveBtn = document.getElementById('save-btn');
const themeSelector = document.getElementById('theme-selector');
const scaleSelector = document.getElementById('scale-selector');

// --- Mermaid初期化関数 --- //
const initializeMermaid = (theme) => {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme,
    themeVariables: {
      fontSize: '20px', // デフォルトのフォントサイズを大きくする
    },
  });
};

// 初期Mermaidテーマ設定
initializeMermaid('default');

// --- イベントリスナー --- //

renderBtn.addEventListener('click', renderMermaid);
saveBtn.addEventListener('click', saveFile);

themeSelector.addEventListener('change', (event) => {
    const selectedTheme = event.target.value;
    initializeMermaid(selectedTheme);
    renderMermaid();
});

// --- 関数 --- //

/**
 * テキストエリアのMermaidコードを解析し、プレビューエリアにSVGとしてレンダリングする
 */
async function renderMermaid() {
  const code = mermaidCodeEl.value;
  if (!code) {
    previewEl.innerHTML = 'コードが入力されていません。';
    return;
  }

  try {
    const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), code);
    previewEl.innerHTML = svg;
  } catch (error) {
    console.error('Mermaid rendering error:', error);
    previewEl.innerHTML = `<pre>レンダリングエラー:\n${error.message}</pre>`;
  }
}

/**
 * レンダリングされた図をファイルとして保存する (mermaid-cliを使用)
 */
async function saveFile() {
  const mermaidCode = mermaidCodeEl.value;
  if (!mermaidCode) {
    alert('保存する前に、まずMermaidコードを入力してください。');
    return;
  }

  try {
    const filePath = await window.api.saveDialog();
    if (!filePath) {
      console.log('Save cancelled.');
      return;
    }

    const scale = parseFloat(scaleSelector.value) || 1;
    const selectedTheme = themeSelector.value;

    const result = await window.api.saveFileCli(mermaidCode, filePath, scale, selectedTheme);

    if (result.success) {
      alert('ファイルが正常に保存されました。');
    } else {
      alert(`保存に失敗しました: ${result.error}\n${result.stderr || ''}`);
    }

  } catch (error) {
    console.error('Failed to save file:', error);
    alert(`ファイルの保存中にエラーが発生しました: ${error.message}`);
  }
}

// --- 初期処理 --- //

// 初期表示用にサンプルコードをセット
mermaidCodeEl.value = `graph LR
    A[要件定義] --> B(設計);
    B --> C{実装};
    C -->|機能A| D[コーディングA];
    C -->|機能B| E[コーディングB];
    D --> F[テストA];
    E --> F[テストA];
    F --> G((リリース));
`;
// アプリ起動時に初回レンダリングを実行
renderMermaid();

