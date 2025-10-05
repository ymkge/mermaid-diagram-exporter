"use client";

export const Header = () => {
  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
        Mermaid Diagram Exporter
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Mermaid.jsのダイアグラムを、PNG, SVG, PDFにエクスポート、またはクリップボードにコピーします。
      </p>
    </header>
  );
};
