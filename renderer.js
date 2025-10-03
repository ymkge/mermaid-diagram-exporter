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
      // このフォントサイズ設定は、このアプリ上のプレビュー表示にのみ適用される。
      // PNG出力時のフォント設定は、main.js側で読み込むmmdc-config.jsonで定義される。
      fontSize: '20px',
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
 * レンダリングされた図をファイルとして保存する。
 * 保存形式（PNG/SVG）に応じて、mainプロセスに異なる処理を依頼する。
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

    const isSvg = filePath.toLowerCase().endsWith('.svg');
    let result;

    if (isSvg) {
      // SVG保存の場合: プレビューに表示されているSVGのHTMLコンテンツを取得し、
      // mainプロセスに渡して直接ファイルに書き込んでもらう。
      // (mmdc経由のSVG生成は、互換性の問題があるため使用しない)
      const previewSvgElement = previewEl.querySelector('svg');
      if (!previewSvgElement) {
        alert('プレビューに表示されているSVGが見つかりません。先にレンダリングしてください。');
        return;
      }
      const svgContent = previewSvgElement.outerHTML;
      result = await window.api.saveSvgContent(svgContent, filePath);

    } else {
      // PNG保存の場合: mainプロセスにMermaidコードを渡し、
      // mermaid-cli (mmdc) を使って画像を生成してもらう。
      const scale = parseFloat(scaleSelector.value) || 1;
      const selectedTheme = themeSelector.value;
      result = await window.api.saveFileCli(mermaidCode, filePath, scale, selectedTheme);
    }

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