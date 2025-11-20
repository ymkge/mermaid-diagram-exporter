"use client";

import { useMermaid } from "@/hooks/use-mermaid";
import { Header } from "@/components/app/Header";
import { ControlPanel } from "@/components/app/ControlPanel";
import { EditorCard } from "@/components/app/EditorCard";
import { PreviewCard } from "@/components/app/PreviewCard";

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
    </div>
  );
}
