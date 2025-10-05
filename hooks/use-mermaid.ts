"use client";

import { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { toast } from 'sonner';

// --- サンプルコード定義 --- //
export const sampleCodes = [
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

// --- カスタムフック --- //
export const useMermaid = () => {
  const [code, setCode] = useState(sampleCodes[0].code);
  const [svg, setSvg] = useState('');
  const [mermaidTheme, setMermaidTheme] = useState('default');
  const [scale, setScale] = useState(2);
  
  const [isRendering, setIsRendering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mermaid レンダリング処理
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });
    const renderMermaid = async () => {
      setIsRendering(true);
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
          themeVariables: { fontSize: '16px' },
        });
        const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), code);
        setSvg(svg);
      } catch (e: any) {
        toast.error('Mermaidの描画に失敗しました。', { description: e.message });
        setSvg('');
      } finally {
        setIsRendering(false);
      }
    };

    const timerId = setTimeout(() => {
      if (code) {
        renderMermaid();
      } else {
        setSvg('');
        toast.info('コードが入力されていません。');
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [code, mermaidTheme]);

  // ファイル保存処理
  const handleSaveSVG = () => {
    if (!svg) return toast.warning('プレビューがありません。');
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SVGファイルを保存しました。');
  };

  const handleSavePNG = async () => {
    if (!code) return toast.warning('コードがありません。');
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, theme: mermaidTheme, scale }),
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
      toast.success('PNGファイルを保存しました。');
    } catch (e: any) {
      toast.error('PNGの生成に失敗しました。', { description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePDF = async () => {
    if (!code) return toast.warning('コードがありません。');
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, theme: mermaidTheme }),
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
      toast.success('PDFファイルを保存しました。');
    } catch (e: any) {
      toast.error('PDFの生成に失敗しました。', { description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!svg) return toast.warning('コピーするプレビューがありません。');
    setIsGenerating(true);
    try {
      const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        const finalScale = scale * dpr;
        canvas.width = img.width * finalScale;
        canvas.height = img.height * finalScale;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvasコンテキストの取得に失敗しました。');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('クリップボード用の画像データの生成に失敗しました。');
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast.success('画像をクリップボードにコピーしました！');
          } catch (err: any) {
            throw new Error(`クリップボードへのコピーに失敗しました: ${err.message}`);
          } finally {
            setIsGenerating(false);
          }
        }, 'image/png');
      };
      img.onerror = () => { throw new Error('画像の読み込みに失敗しました。'); };
      img.src = dataUrl;
    } catch (e: any) {
      toast.error('クリップボードへのコピーに失敗しました。', { description: e.message });
      setIsGenerating(false);
    }
  };

  return {
    code, setCode,
    svg,
    mermaidTheme, setMermaidTheme,
    scale, setScale,
    isRendering,
    isGenerating,
    handleSaveSVG,
    handleSavePNG,
    handleSavePDF,
    handleCopyToClipboard,
  };
};
