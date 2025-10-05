"use client";

import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Editor, useMonaco } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileImage, FileText, Copy, Download, Loader2 } from 'lucide-react';

// --- Mermaid 初期化 --- //
mermaid.initialize({
  startOnLoad: false,
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

const themeOptions = ['default', 'dark', 'forest', 'neutral'];
const scaleOptions = [
  { value: 1, label: 'x1' },
  { value: 2, label: 'x2 (高)' },
  { value: 3, label: 'x3 (超高)' },
  { value: 4, label: 'x4 (最大)' },
];

// --- メインコンポーネント --- //
export default function HomePage() {
  const [code, setCode] = useState(sampleCodes[0].code);
  const [svg, setSvg] = useState('');
  const [mermaidTheme, setMermaidTheme] = useState('default');
  const [scale, setScale] = useState(2);
  
  const [isRendering, setIsRendering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { theme: appTheme } = useTheme();

  // --- Mermaid レンダリング処理 --- //
  useEffect(() => {
    const renderMermaid = async () => {
      setIsRendering(true);
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
          themeVariables: {
            fontSize: '16px',
          },
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

  // --- ファイル保存処理 --- //
  const handleSaveSVG = () => {
    if (!svg) {
      toast.warning('プレビューがありません。');
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

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">Mermaid Diagram Exporter</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Mermaid.jsのダイアグラムを、PNG, SVG, PDFにエクスポート、またはクリップボードにコピーします。
        </p>
      </header>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">サンプル</label>
            <Select onValueChange={(value) => {
              const selected = sampleCodes.find(s => s.label === value);
              if (selected) setCode(selected.code);
            }} defaultValue={sampleCodes[0].label}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="サンプルを選択" />
              </SelectTrigger>
              <SelectContent>
                {sampleCodes.map(s => <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">テーマ</label>
            <Select onValueChange={setMermaidTheme} defaultValue={mermaidTheme}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="テーマを選択" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">解像度</label>
            <Select onValueChange={(v) => setScale(Number(v))} defaultValue={String(scale)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="解像度を選択" />
              </SelectTrigger>
              <SelectContent>
                {scaleOptions.map(s => <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-grow" />
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleSaveSVG} disabled={isGenerating}>
              <FileText className="mr-2 h-4 w-4" /> SVG
            </Button>
            <Button variant="outline" onClick={handleSavePDF} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              PDF
            </Button>
            <Button onClick={handleCopyToClipboard} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
              コピー
            </Button>
            <Button onClick={handleSavePNG} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileImage className="mr-2 h-4 w-4" />}
              PNG
            </Button>
          </div>
        </CardContent>
      </Card>

      <main className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden h-[60vh]">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={code}
                onChange={(value) => setCode(value || '')}
                theme={appTheme === 'dark' ? 'vs-dark' : 'light'}
                options={{ minimap: { enabled: false }, wordWrap: 'on', fontSize: 14 }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[60vh] overflow-auto">
            {isRendering ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Rendering...</span>
              </div>
            ) : svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <div className="text-muted-foreground">コードを入力してください</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}