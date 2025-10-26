'use client';

/**
 * Mermaid Diagram Exporter
 *
 * @description
 * このファイルは、IDで指定されたDOM要素から各種形式へのエクスポート処理を担当するモジュールです。
 * PNG, PDFへの変換、およびクリップボードへのコピー機能を提供します。
 * html-to-imageライブラリを使用します。
 */

import { jsPDF } from 'jspdf';
import { toPng, Options } from 'html-to-image';

// --- プライベートヘルパー関数 ---

/**
 * エクスポート用の共通オプションを取得する
 * @param scale 解像度スケール
 */
const getExportOptions = (scale: number): Options => ({
  pixelRatio: scale,
  backgroundColor: 'white',
  // フォントの埋め込み処理をスキップし、クロスオリジンエラーを回避する
  skipFonts: true,
});

/**
 * Data URIをファイルとしてダウンロードする
 * @param dataUri ダウンロードするData URI
 * @param filename 保存するファイル名
 */
const downloadDataUri = (dataUri: string, filename: string) => {
  const a = document.createElement('a');
  a.href = dataUri;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * DOM要素をPNGのBlobに変換する
 * @param elementId 対象要素のID
 * @param scale 解像度スケール
 * @returns PNGのBlob
 */
const elementToPngBlob = async (elementId: string, scale: number): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`要素(ID: ${elementId})が見つかりません。`);
  }

  const options = getExportOptions(scale);
  const dataUrl = await toPng(element, options);
  const res = await fetch(dataUrl);
  return await res.blob();
};


// --- パブリックAPI ---

/**
 * DOM要素をPNGファイルとしてダウンロードする
 * @param elementId 対象要素のID
 * @param scale 解像度スケール
 */
export const exportToPng = async (elementId: string, scale: number): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`要素(ID: ${elementId})が見つかりません。`);
  }

  const options = getExportOptions(scale);
  const dataUrl = await toPng(element, options);
  downloadDataUri(dataUrl, 'diagram.png');
};

/**
 * DOM要素をクリップボードにコピーする
 * @param elementId 対象要素のID
 * @param scale 解像度スケール
 */
export const copyToClipboard = async (elementId: string, scale: number): Promise<void> => {
  const blob = await elementToPngBlob(elementId, scale);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
};

/**
 * DOM要素をPDFファイルとしてダウンロードする
 * @param elementId 対象要素のID
 * @param scale 解像度スケール
 */
export const exportToPdf = async (elementId: string, scale: number): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`要素(ID: ${elementId})が見つかりません。`);
  }

  const options = getExportOptions(scale);
  const pngDataUrl = await toPng(element, options);

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (err) => reject(new Error(`PNG画像の読み込みに失敗しました: ${err}`));
    image.src = pngDataUrl;
  });

  const { width, height } = image;
  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
  });

  pdf.addImage(image, 'PNG', 0, 0, width, height);
  pdf.save('diagram.pdf');
};