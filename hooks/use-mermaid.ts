'use client';

import { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { toast } from 'sonner';
import {
  exportToPng,
  exportToPdf,
  copyToClipboard,
} from '@/lib/exporter';

// --- 型定義 --- //
export type MermaidTheme = "default" | "base" | "dark" | "forest" | "neutral" | "null" | undefined;

// --- 定数定義 --- //
const PREVIEW_ELEMENT_ID = 'mermaid-preview-area';
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
          fontFamily: 'Trebuchet MS',
          htmlLabels: false,
          themeVariables: { primaryTextColor: '#000000' },
        });
        let { svg: svgCode } = await mermaid.render('mermaid-graph-' + Date.now(), code);

        setSvg(svgCode);
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

  // SVG保存処理
  const handleSaveSVG = () => {
    try {
      if (!svg) throw new Error('SVGデータがありません。');
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
    } catch (e: any) {
      toast.error('SVGの保存に失敗しました。', { description: e.message });
    }
  };

  // PNG保存処理
  const handleSavePNG = async () => {
    setIsGenerating(true);
    try {
      await exportToPng(PREVIEW_ELEMENT_ID, scale);
      toast.success('PNGファイルを保存しました。');
    } catch (e: any) {
      toast.error('PNGの保存に失敗しました。', { description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  // PDF保存処理
  const handleSavePDF = async () => {
    setIsGenerating(true);
    try {
      await exportToPdf(PREVIEW_ELEMENT_ID, scale);
      toast.success('PDFファイルを保存しました。');
    } catch (e: any) {
      toast.error('PDFの保存に失敗しました。', { description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  // クリップボードへのコピー処理
  const handleCopyToClipboard = async () => {
    setIsGenerating(true);
    try {
      await copyToClipboard(PREVIEW_ELEMENT_ID, scale);
      toast.success('画像をクリップボードにコピーしました！');
    } catch (e: any) {
      let description = e.message;
      if (e.name === 'NotAllowedError') {
        description = 'ブラウザの権限設定でクリップボードへのアクセスを許可してください。';
      }
      toast.error('クリップボードへのコピーに失敗しました。', { description });
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
