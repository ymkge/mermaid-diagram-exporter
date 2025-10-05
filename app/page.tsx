"use client";

import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Editor } from '@monaco-editor/react';

// --- Mermaid 初期化 --- //
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  themeVariables: {
    fontSize: '16px',
  },
});

// --- サンプルコード --- //
const sampleCodes = [
  {
    label: 'フローチャート',
    code: `graph LR
    A[要件定義] --> B(設計);
    B --> C{実装};
    C -->|機能A| D[コーディングA];
    C -->|機能B| E[コーディングB];
    D --> F[テストA];
    E --> F[テストA];
    F --> G((リリース));
`,
  },
  {
    label: 'シーケンス図',
    code: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts<br/>prevail...
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
`,
  },
  {
    label: 'ガントチャート',
    code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d
`,
  },
];

// --- メインコンポーネント --- //
export default function HomePage() {
  const [code, setCode] = useState(sampleCodes[0].code);
  const [svg, setSvg] = useState('');
  const [theme, setTheme] = useState('default');
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const [editorTheme, setEditorTheme] = useState('light');

  // --- OSのテーマ変更を監視 --- //
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setEditorTheme(darkModeMediaQuery.matches ? 'vs-dark' : 'light');
    const handler = (e: MediaQueryListEvent) => {
      setEditorTheme(e.matches ? 'vs-dark' : 'light');
    };
    darkModeMediaQuery.addEventListener('change', handler);
    return () => darkModeMediaQuery.removeEventListener('change', handler);
  }, []);

  // --- Mermaid レンダリング処理 --- //
  useEffect(() => {
    const renderMermaid = async () => {
      setLoading(true);
      setError('');
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: theme,
          themeVariables: {
            fontSize: '16px',
          },
        });
        const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), code);
        setSvg(svg);
      } catch (e: any) {
        setError(e.message);
        setSvg('');
      } finally {
        setLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      if (code) {
        renderMermaid();
      } else {
        setSvg('');
        setError('コードが入力されていません。');
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [code, theme]);

  // --- ファイル保存処理 --- //
  const handleSave = async (format: 'svg' | 'png' | 'pdf') => {
    if (!code) {
      alert('保存するコードがありません。');
      return;
    }
    if (format === 'svg') {
      handleSaveSVG();
    } else if (format === 'png') {
      handleSavePNG();
    } else {
      handleSavePDF();
    }
  };

  const handleSaveSVG = () => {
    if (!svg) {
      alert('プレビューがありません。');
      return;
    }
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSavePNG = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/generate-png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, theme, scale }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PNGの生成に失敗しました。');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePDF = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, theme }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDFの生成に失敗しました。');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI --- //
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="p-4 bg-white border-b border-gray-300 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Mermaid Diagram Exporter</h1>
      </header>

      <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="sample-selector" className="text-sm font-medium text-gray-700">サンプル:</label>
          <select
            id="sample-selector"
            onChange={(e) => {
              const selectedSample = sampleCodes.find(sample => sample.label === e.target.value);
              if (selectedSample) {
                setCode(selectedSample.code);
              }
            }}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {sampleCodes.map(sample => (
              <option key={sample.label} value={sample.label}>{sample.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="theme-selector" className="text-sm font-medium text-gray-700">テーマ:</label>
          <select
            id="theme-selector"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="forest">Forest</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="scale-selector" className="text-sm font-medium text-gray-700">PNG解像度:</label>
          <select
            id="scale-selector"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="1">x1</option>
            <option value="2">x2 (高)</option>
            <option value="3">x3 (超高)</option>
            <option value="4">x4 (最大)</option>
          </select>
        </div>
        <div className="flex-grow" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('svg')}
            disabled={loading || !!error}
            className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            SVG保存
          </button>
          <button
            onClick={() => handleSave('pdf')}
            disabled={loading}
            className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '生成中...' : 'PDF保存'}
          </button>
          <button
            onClick={() => handleSave('png')}
            disabled={loading}
            className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '生成中...' : 'PNG保存'}
          </button>
        </div>
      </div>

      <main className="flex-1 grid grid-cols-2 gap-2 p-2 overflow-hidden">
        {/* Editor */}
        <div className="flex flex-col bg-white rounded-lg shadow overflow-hidden">
          <h2 className="p-3 text-lg font-semibold border-b border-gray-200">Mermaid Code</h2>
          <div className="flex-1 w-full h-full">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={code}
              onChange={(value) => setCode(value || '')}
              theme={editorTheme}
              options={{ minimap: { enabled: false }, wordWrap: 'on' }}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col bg-white rounded-lg shadow">
          <h2 className="p-3 text-lg font-semibold border-b border-gray-200">Preview</h2>
          <div className="p-4 flex-1 flex items-center justify-center overflow-auto">
            {loading && <p className="text-gray-500">レンダリング中...</p>}
            {error && <pre className="text-red-500 whitespace-pre-wrap">{error}</pre>}
            {!loading && !error && svg && (
              <div ref={previewRef} dangerouslySetInnerHTML={{ __html: svg }} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
