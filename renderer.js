// renderer.js

// mermaidライブラリをnode_modulesからインポート
import mermaid from './node_modules/mermaid/dist/mermaid.esm.min.mjs';

// DOM要素の取得
const mermaidCodeEl = document.getElementById('mermaid-code');
const previewEl = document.getElementById('preview');
const renderBtn = document.getElementById('render-btn');
const saveBtn = document.getElementById('save-btn');
const themeSelector = document.getElementById('theme-selector');
const scaleSelector = document.getElementById('scale-selector');

// 初期Mermaidテーマ設定
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  themeVariables: {
    fontSize: '20px', // デフォルトのフォントサイズを大きくする
  },
});

// --- イベントリスナー --- //

// 「レンダリング/プレビュー」ボタンのクリックイベント
renderBtn.addEventListener('click', renderMermaid);

// 「PNG保存」ボタンのクリックイベント
saveBtn.addEventListener('click', saveAsPng);

// テーマセレクターの変更イベント
themeSelector.addEventListener('change', (event) => {
    // Mermaidのテーマを更新し、再レンダリング
    const selectedTheme = event.target.value;
    mermaid.initialize({
      startOnLoad: false,
      theme: selectedTheme,
      themeVariables: {
        fontSize: '20px', // デフォルトのフォントサイズを大きくする
      },
    });
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
    // MermaidコードからユニークなIDを生成し、SVGをレンダリング
    const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), code);
    previewEl.innerHTML = svg;
  } catch (error) {
    console.error('Mermaid rendering error:', error);
    previewEl.innerHTML = `<pre>レンダリングエラー:\n${error.message}</pre>`;
  }
}

/**
 * レンダリングされたSVGをPNGとして保存する (mermaid-cliを使用)
 */
async function saveAsPng() {
  const mermaidCode = mermaidCodeEl.value;
  if (!mermaidCode) {
    alert('PNGとして保存する前に、まずMermaidコードを入力してください。');
    return;
  }

  try {
    // 1. 保存ダイアログを表示し、保存パスを取得
    const filePath = await window.api.saveDialog();
    if (!filePath) {
      // ユーザーがダイアログをキャンセルした場合
      console.log('Save cancelled.');
      return;
    }

    // 2. 解像度スケールを取得
    const scale = parseFloat(scaleSelector.value) || 1;

    // 3. プレビューのSVG要素から元の幅と高さを取得
    const svgElement = previewEl.querySelector('svg');
    let originalWidth = 800; // デフォルト値
    let originalHeight = 600; // デフォルト値

    if (svgElement) {
      // SVGのviewBoxから幅と高さを取得
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(' ');
        if (parts.length === 4) {
          originalWidth = parseFloat(parts[2]);
          originalHeight = parseFloat(parts[3]);
        }
      } else {
        // viewBoxがない場合はwidth/height属性から取得
        originalWidth = parseFloat(svgElement.getAttribute('width')) || originalWidth;
        originalHeight = parseFloat(svgElement.getAttribute('height')) || originalHeight;
      }
    }

    // mmdcに渡す幅と高さを計算
    const outputWidth = originalWidth * scale;
    const outputHeight = originalHeight * scale;

    // 4. メインプロセスにmermaid-cliでのPNG生成を依頼
    const selectedTheme = themeSelector.value; // 現在選択されているテーマを取得
    const result = await window.api.savePngCli(mermaidCode, filePath, outputWidth, outputHeight, 1, selectedTheme); // テーマ情報を追加

    if (result.success) {
      alert('PNGファイルが正常に保存されました。');
    } else {
      alert(`保存に失敗しました: ${result.error}\n${result.stderr || ''}`);
    }

  } catch (error) {
    console.error('Failed to save PNG:', error);
    alert(`PNGの保存中にエラーが発生しました: ${error.message}`);
  }
}

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
