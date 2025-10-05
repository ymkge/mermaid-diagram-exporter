"use client";

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditorCardProps {
  code: string;
  setCode: (code: string) => void;
}

export const EditorCard = ({ code, setCode }: EditorCardProps) => {
  const { theme: appTheme } = useTheme();

  return (
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
            onChange={(value) => setCode(value || "")}
            theme={appTheme === "dark" ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              wordWrap: "on",
              fontSize: 14,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
