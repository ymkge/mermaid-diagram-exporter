"use client";

export const Header = () => {
  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
        Mermaid Diagram Exporter
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Mermaidのコードからグラフを作成し、PNG, SVG, PDFにエクスポート、またはクリップボードにコピー可能です。
      </p>
    </header>
  );
};
