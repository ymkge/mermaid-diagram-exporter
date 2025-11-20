"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { MutableRefObject } from "react";

interface PreviewCardProps {
  svg: string;
  isRendering: boolean;
  zoomPanPinchRef: MutableRefObject<ReactZoomPanPinchRef | null>;
}

export const PreviewCard = ({
  svg,
  isRendering,
  zoomPanPinchRef,
}: PreviewCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent
        id="mermaid-preview-area" // エクスポート機能がこのIDを参照する
        className="flex items-start justify-start h-[60vh] overflow-auto font-noto-sans"
        // HACK: ダークモード時にTailwindの`bg-white`クラスが正しく適用されない問題への対策。
        // select.tsxの事例と同様に、ビルドプロセスでクラスがパージされる問題の可能性が高い。
        // インラインスタイルで直接背景色を指定することで、この問題を確実に回避する。
        style={{ backgroundColor: "#f0f0f0" }}
      >
        {isRendering ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Rendering...</span>
          </div>
        ) : svg ? (
          <TransformWrapper
            ref={zoomPanPinchRef}
            initialScale={1}
            minScale={0.2}
            maxScale={10}
          >
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
            >
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <div className="text-muted-foreground">コードを入力してください</div>
        )}
      </CardContent>
    </Card>
  );
};
