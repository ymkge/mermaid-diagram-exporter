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
import { toBlob } from 'html-to-image';

// --- プライベートヘルパー関数 ---

/**
 * エクスポート用の共通オプションを取得する
 * @param scale 解像度スケール
 */
const getExportOptions = (scale: number) => ({
  pixelRatio: scale,
  backgroundColor: '#f0f0f0', // プレビューの背景色と合わせる
  // フォントの埋め込み処理をスキップし、クロスオリジンエラーを回避する
  skipFonts: true,
});

/**
 * Data URIまたはBlobをファイルとしてダウンロードする
 * @param data ダウンロードするData URIまたはBlob
 * @param filename 保存するファイル名
 */
const downloadFile = (data: string | Blob, filename: string) => {
  const a = document.createElement('a');
  if (typeof data === 'string') {
    a.href = data;
  } else {
    a.href = URL.createObjectURL(data);
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof data !== 'string') {
    URL.revokeObjectURL(a.href);
  }
};

/**
 * DOM要素をPNGのBlobに変換する
 * @param elementId 対象要素のID
 * @param scale 解像度スケール
 * @returns PNGのBlob
 */
const elementToPngBlob = async (elementId: string, scale: number): Promise<Blob> => {
  const parentElement = document.getElementById(elementId);
  if (!parentElement) {
    throw new Error(`親要素(ID: ${elementId})が見つかりません。`);
  }

  // 実際のコンテンツ要素を取得 (react-zoom-pan-pinchでラップされた内部の要素)
  const targetElement = parentElement.querySelector<HTMLElement>(':scope > div > div > div');
  if (!targetElement) {
    throw new Error('画像化対象のコンテンツ要素が見つかりません。');
  }

  const options = {
    ...getExportOptions(scale),
    width: targetElement.scrollWidth,
    height: targetElement.scrollHeight,
  };

  const blob = await toBlob(targetElement, options);
  if (!blob) {
    throw new Error('画像のBlob生成に失敗しました。');
  }
  return blob;
};


// --- パブリックAPI ---

/**
 * SVG文字列をSVGファイルとしてダウンロードする (この関数はexporter.tsから独立させるべきだが、一旦ここに残す)
 * @param svg SVG文字列
 */
export const exportSvg = (svg: string): void => {
  if (!svg) throw new Error('SVGデータがありません。');
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadFile(blob, 'diagram.svg');
};

/**
 * DOM要素をPNGファイルとしてダウンロードする
 * @param elementId 対象要素のID
 * @param scale 解像度スケール
 */
export const exportToPng = async (elementId: string, scale: number): Promise<void> => {
  const blob = await elementToPngBlob(elementId, scale);
  downloadFile(blob, 'diagram.png');
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
  const blob = await elementToPngBlob(elementId, scale);
  const pngDataUrl = URL.createObjectURL(blob);

  try {
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
  } finally {
    // メモリリークを防ぐために、生成したURLを解放する
    URL.revokeObjectURL(pngDataUrl);
  }
};
