"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PreviewCardProps {
  svg: string;
  isRendering: boolean;
}

export const PreviewCard = ({ svg, isRendering }: PreviewCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex items-start justify-start h-[60vh] overflow-auto">
        {isRendering ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Rendering...</span>
          </div>
        ) : svg ? (
          <div className="scale-[2] origin-top-left" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className="text-muted-foreground">コードを入力してください</div>
        )}
      </CardContent>
    </Card>
  );
};
