"use client";

import { useMermaid } from "@/hooks/use-mermaid";
import { Header } from "@/components/app/Header";
import { ControlPanel } from "@/components/app/ControlPanel";
import { EditorCard } from "@/components/app/EditorCard";
import { PreviewCard } from "@/components/app/PreviewCard";
import { TriangleAlert } from "lucide-react";

export default function HomePage() {
  const mermaidProps = useMermaid();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Header />
      <ControlPanel {...mermaidProps} />
      <main className="grid grid-cols-2 gap-6">
        <EditorCard code={mermaidProps.code} setCode={mermaidProps.setCode} />
        <PreviewCard
          svg={mermaidProps.svg}
          isRendering={mermaidProps.isRendering}
          zoomPanPinchRef={mermaidProps.zoomPanPinchRef}
        />
      </main>
      {mermaidProps.errorMessage && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-destructive flex items-center">
            <TriangleAlert className="h-5 w-5 mr-2" />
            Mermaid エラー
          </h3>
          <pre className="mt-2 p-4 bg-muted rounded-md text-destructive-foreground overflow-x-auto text-sm">
            <code>{mermaidProps.errorMessage}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
