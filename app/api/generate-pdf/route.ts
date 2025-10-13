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

    const tempInputPath = path.join('/tmp', `mermaid-input-${Date.now()}.mmd`);
    const tempOutputPath = path.join('/tmp', `mermaid-output-${Date.now()}.pdf`);
    
    // プロジェクト内のコピーを参照するようパスを変更
    const cliPath = path.resolve(process.cwd(), 'lib', 'mmdc-bin', 'src', 'cli.js');

    await fs.writeFile(tempInputPath, code);

    const puppeteerConfig = {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: chromium.headless,
    };

    const mmdcConfig = {
      "fontFamily": "\"游ゴシック体\", \"Yu Gothic\", \"メイリオ\", Meiryo, sans-serif",
      "puppeteerConfigFile": puppeteerConfig
    };
    const configPath = path.join('/tmp', `mmdc-config-${Date.now()}.json`);
    await fs.writeFile(configPath, JSON.stringify(mmdcConfig));

    const command = `node ${cliPath} -i ${tempInputPath} -o ${tempOutputPath} -t ${theme || 'default'} -c ${configPath}`;

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

    const pdfBuffer = await fs.readFile(tempOutputPath);

    await fs.unlink(tempInputPath);
    await fs.unlink(tempOutputPath);
    await fs.unlink(configPath);

    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );
    const blob = new Blob([arrayBuffer as ArrayBuffer], { type: 'application/pdf' });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="diagram.pdf"',
      },
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}