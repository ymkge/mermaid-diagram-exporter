// renderer.js

// mermaidライブラリをnode_modulesからインポート
import mermaid from './node_modules/mermaid/dist/mermaid.esm.min.mjs';

// DOM要素の取得
const mermaidCodeEl = document.getElementById('mermaid-code');
const previewEl = document.getElementById('preview');
const renderBtn = document.getElementById('render-btn');
const saveBtn = document.getElementById('save-btn');
const themeSelector = document.getElementById('theme-selector');
const scaleSelector = document.getElementById('scale-selector'); // 追加

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
 * レンダリングされたSVGをPNGとして保存する
 */
async function saveAsPng() {
  const svgElement = previewEl.querySelector('svg');
  if (!svgElement) {
    alert('PNGとして保存する前に、まずMermaidコードをレンダリングしてください。');
    return;
  }

  try {
    // 1. SVGをCanvasに描画
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgXml = new XMLSerializer().serializeToString(svgElement);
    const svgBase64 = btoa(unescape(encodeURIComponent(svgXml)));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    const img = new Image();
    img.onload = async () => {
      // 解像度スケールを取得
      const scale = parseFloat(scaleSelector.value) || 1;

      // CanvasのサイズをSVGのサイズ x スケールに設定
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // 背景を白で塗りつぶす（透過SVGの場合に備える）
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // スケールを適用して画像を描画
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. CanvasからPNGのバイナリデータを取得 (Bufferの代わりにUint8Arrayを使用)
      const pngDataUrl = canvas.toDataURL('image/png');
      const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // 3. メインプロセスに保存ダイアログの表示を依頼
      const filePath = await window.api.saveDialog();
      if (!filePath) {
        // ユーザーがダイアログをキャンセルした場合
        console.log('Save cancelled.');
        return;
      }

      // 4. メインプロセスにPNGデータの保存を依頼
      const result = await window.api.savePng(filePath, byteArray);
      if (result.success) {
        alert('PNGファイルが正常に保存されました。');
      } else {
        alert(`保存に失敗しました: ${result.error}`);
      }
    };
    img.src = dataUrl;

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
