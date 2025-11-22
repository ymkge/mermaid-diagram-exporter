"use client";

import { useMermaid } from "@/hooks/use-mermaid";
import { Header } from "@/components/app/Header";
import { ControlPanel } from "@/components/app/ControlPanel";
import { EditorCard } from "@/components/app/EditorCard";
import { PreviewCard } from "@/components/app/PreviewCard";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";

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
        <Alert variant="destructive" className="mt-6">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Mermaid エラー</AlertTitle>
          <pre className="mt-2 w-full overflow-auto text-sm">
            <code>{mermaidProps.errorMessage}</code>
          </pre>
        </Alert>
      )}
    </div>
  );
}
