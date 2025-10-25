'use client';

/**
 * Mermaid Diagram Exporter
 * 
 * @description
 * このファイルは、SVGから各種形式へのエクスポート処理を担当するモジュールです。
 * PNG, PDFへの変換、およびクリップボードへのコピー機能を提供します。
 */

import { jsPDF } from 'jspdf';
import { Canvg, presets } from 'canvg';

// --- プライベートヘルパー関数 ---

/**
 * 指定されたBlobをファイルとしてダウンロードする
 * @param blob ダウンロードするBlob
 * @param filename 保存するファイル名
 */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * SVG文字列をPNGのBlobに変換する
 * @param svg SVG文字列
 * @param scale 解像度スケール
 * @returns PNGのBlob
 */
const svgToPngBlob = async (svg: string, scale: number): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvasコンテキストが取得できません。');
  }

  // SVGのサイズを取得
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.innerHTML = svg;
  document.body.appendChild(tempDiv);
  const svgElement = tempDiv.querySelector('svg');
  if (!svgElement) throw new Error('SVG要素が見つかりません。');
  const width = svgElement.getBoundingClientRect().width;
  const height = svgElement.getBoundingClientRect().height;
  document.body.removeChild(tempDiv);

  // Canvasのサイズを設定
  canvas.width = width * scale;
  canvas.height = height * scale;
  
  // Canvasコンテキストをスケーリング
  context.scale(scale, scale);

  // canvgで描画
  const v = await Canvg.from(context, svg, presets.browser);
  await v.render();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('CanvasからBlobの生成に失敗しました。'));
      }
    }, 'image/png');
  });
};


// --- パブリックAPI --- 

/**
 * SVGをSVGファイルとしてダウンロードする
 * @param svg SVG文字列
 */
export const exportToSvg = (svg: string): void => {
  if (!svg) throw new Error('SVGデータがありません。');
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadBlob(blob, 'diagram.svg');
};

/**
 * SVGをPNGファイルとしてダウンロードする
 * @param svg SVG文字列
 * @param scale 解像度スケール
 */
export const exportToPng = async (svg: string, scale: number): Promise<void> => {
  if (!svg) throw new Error('SVGデータがありません。');
  const blob = await svgToPngBlob(svg, scale);
  downloadBlob(blob, 'diagram.png');
};

/**
 * SVGをクリップボードにコピーする
 * @param svg SVG文字列
 * @param scale 解像度スケール
 */
export const copyToClipboard = async (svg: string, scale: number): Promise<void> => {
  if (!svg) throw new Error('SVGデータがありません。');
  const blob = await svgToPngBlob(svg, scale);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
};

/**
 * SVGをPDFファイルとしてダウンロードする
 * @param svg SVG文字列
 * @param scale 解像度スケール
 */
export const exportToPdf = async (svg: string, scale: number): Promise<void> => {
  if (!svg) throw new Error('SVGデータがありません。');

  const pngBlob = await svgToPngBlob(svg, scale);
  const pngUrl = URL.createObjectURL(pngBlob);

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('PNG画像の読み込みに失敗しました。'));
    image.src = pngUrl;
  });

  const { width, height } = image;
  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
  });

  pdf.addImage(image, 'PNG', 0, 0, width, height);
  pdf.save('diagram.pdf');

  URL.revokeObjectURL(pngUrl);
};
