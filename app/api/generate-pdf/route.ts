import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import chromium from '@sparticuz/chromium';

export async function POST(request: Request) {
  try {
    const { code, theme } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Mermaid code is required' }, { status: 400 });
    }

    // --- mmdc を実行してPDFを生成 --- //
    const tempInputPath = path.join('/tmp', `mermaid-input-${Date.now()}.mmd`);
    const tempOutputPath = path.join('/tmp', `mermaid-output-${Date.now()}.pdf`);
    
    // mmdc の実行パス
    const mmdcPath = path.resolve(process.cwd(), 'node_modules', '.bin', 'mmdc');

    await fs.writeFile(tempInputPath, code);

    // Vercel環境用のPuppeteer設定
    const puppeteerConfig = {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: chromium.headless,
    };

    // 日本語フォント対応のための設定
    const mmdcConfig = {
      "fontFamily": ""游ゴシック体", "Yu Gothic", "メイリオ", Meiryo, sans-serif",
      "puppeteerConfigFile": puppeteerConfig
    };
    const configPath = path.join('/tmp', `mmdc-config-${Date.now()}.json`);
    await fs.writeFile(configPath, JSON.stringify(mmdcConfig));

    const command = `${mmdcPath} -i ${tempInputPath} -o ${tempOutputPath} -t ${theme || 'default'} -c ${configPath}`;

    await new Promise<void>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`mmdc exec error: ${error}`);
          console.error(`mmdc stderr: ${stderr}`);
          reject(new Error(`Failed to generate PDF: ${stderr}`));
          return;
        }
        resolve();
      });
    });

    // --- 生成されたPDFを読み込んでレスポンスとして返す --- //
    const pdfBuffer = await fs.readFile(tempOutputPath);

    // --- 一時ファイルを削除 --- //
    await fs.unlink(tempInputPath);
    await fs.unlink(tempOutputPath);
    await fs.unlink(configPath);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="diagram.pdf"',
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
