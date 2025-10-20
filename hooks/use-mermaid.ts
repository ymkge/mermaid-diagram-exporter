"use client";

import { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { toast } from 'sonner';

// --- 型定義 --- //
export type MermaidTheme = "default" | "base" | "dark" | "forest" | "neutral" | "null" | undefined;

// --- 定数定義 --- //
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
  const [mermaidTheme, setMermaidTheme] = useState<MermaidTheme>('default');
  const [scale, setScale] = useState(2);
  
  const [isRendering, setIsRendering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mermaid レンダリング処理 (クライアントサイド)
  useEffect(() => {
    const renderMermaid = async () => {
      setIsRendering(true);
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
          securityLevel: 'strict',
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

  // --- ファイル生成・操作関連 --- //

  /**
   * サーバーサイドで画像/PDFを生成し、Blobを返す
   * @param format 生成するフォーマット ('png' | 'pdf')
   */
  const generateBlob = async (format: 'png' | 'pdf'): Promise<Blob> => {
    const endpoint = `/api/generate-${format}`;
    const body = format === 'png' 
      ? { code, theme: mermaidTheme, scale }
      : { code, theme: mermaidTheme };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `${format.toUpperCase()}の生成に失敗しました。`);
    }
    return response.blob();
  };

  /**
   * 指定されたBlobをファイルとしてダウンロードする
   * @param blob ダウンロードするBlob
   * @param filename 保存するファイル名
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // SVG保存処理
  const handleSaveSVG = () => {
    if (!svg) return toast.warning('プレビューがありません。');
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, 'diagram.svg');
    toast.success('SVGファイルを保存しました。');
  };

  // PNG保存処理
  const handleSavePNG = async () => {
    if (!code) return toast.warning('コードがありません。');
    setIsGenerating(true);
    try {
      const blob = await generateBlob('png');
      downloadBlob(blob, 'diagram.png');
      toast.success('PNGファイルを保存しました。');
    } catch (e: any) {
      toast.error('PNGの生成に失敗しました。', { description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  // PDF保存処理
  const handleSavePDF = async () => {
    if (!code) return toast.warning('コードがありません。');
    setIsGenerating(true);
    try {
      const blob = await generateBlob('pdf');
      downloadBlob(blob, 'diagram.pdf');
      toast.success('PDFファイルを保存しました。');
    } catch (e: any) {
      toast.error('PDFの生成に失敗しました。', { description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  // クリップボードへのコピー処理
  const handleCopyToClipboard = async () => {
    if (!code) return toast.warning('コードがありません。');
    setIsGenerating(true);
    try {
      const blob = await generateBlob('png');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('画像をクリップボードにコピーしました！');
    } catch (e: any) {
      console.error('Copy to clipboard failed:', e);
      toast.error('クリップボードへのコピーに失敗しました。', { description: e.message });
    } finally {
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