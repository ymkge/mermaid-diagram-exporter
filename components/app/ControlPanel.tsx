"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sampleCodes, type MermaidTheme } from "@/hooks/use-mermaid";
import { FileImage, FileText, Copy, Download, Loader2 } from "lucide-react";

const themeOptions: Exclude<MermaidTheme, undefined | null>[] = ['default', 'dark', 'forest', 'neutral'];
const scaleOptions = [
  { value: 1, label: 'x1' },
  { value: 2, label: 'x2 (高)' },
  { value: 3, label: 'x3 (超高)' },
  { value: 4, label: 'x4 (最大)' },
];

interface ControlPanelProps {
  setCode: (code: string) => void;
  mermaidTheme: MermaidTheme;
  setMermaidTheme: (theme: MermaidTheme) => void;
  scale: number;
  setScale: (scale: number) => void;
  isGenerating: boolean;
  handleSaveSVG: () => void;
  handleSavePDF: () => void;
  handleCopyToClipboard: () => void;
  handleSavePNG: () => void;
}

export const ControlPanel = ({ ...props }: ControlPanelProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">サンプル</label>
          <Select
            onValueChange={(value) => {
              const selected = sampleCodes.find((s) => s.label === value);
              if (selected) props.setCode(selected.code);
            }}
            defaultValue={sampleCodes[0].label}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="サンプルを選択" />
            </SelectTrigger>
            <SelectContent>
              {sampleCodes.map((s) => (
                <SelectItem key={s.label} value={s.label}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">テーマ</label>
          <Select
            onValueChange={(v) => props.setMermaidTheme(v as MermaidTheme)}
            value={props.mermaidTheme}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="テーマを選択" />
            </SelectTrigger>
            <SelectContent>
              {themeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">解像度</label>
          <Select
            onValueChange={(v) => props.setScale(Number(v))}
            defaultValue={String(props.scale)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="解像度を選択" />
            </SelectTrigger>
            <SelectContent>
              {scaleOptions.map((s) => (
                <SelectItem key={s.value} value={String(s.value)}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-grow" />
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={props.handleSaveSVG} disabled={props.isGenerating}>
            <FileText className="mr-2 h-4 w-4" /> SVG
          </Button>
          <Button variant="outline" onClick={props.handleSavePDF} disabled={props.isGenerating}>
            {props.isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            PDF
          </Button>
          <Button onClick={props.handleCopyToClipboard} disabled={props.isGenerating}>
            {props.isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
            コピー
          </Button>
          <Button onClick={props.handleSavePNG} disabled={props.isGenerating}>
            {props.isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileImage className="mr-2 h-4 w-4" />}
            PNG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};