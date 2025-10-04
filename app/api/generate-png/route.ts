import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { code, theme, scale } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Mermaid code is required' }, { status: 400 });
    }

    // --- mmdc を実行してPNGを生成 --- //
    const tempInputPath = path.join('/tmp', `mermaid-input-${Date.now()}.mmd`);
    const tempOutputPath = path.join('/tmp', `mermaid-output-${Date.now()}.png`);
    
    // mmdc の実行パス
    // Vercel環境では `node_modules` のパスが異なる可能性があるため、動的に解決
    const mmdcPath = path.resolve(process.cwd(), 'node_modules', '.bin', 'mmdc');

    await fs.writeFile(tempInputPath, code);

    // 日本語フォント対応のための設定
    // 元の mmdc-config.json の内容をここにオブジェクトとして定義
    const mmdcConfig = {
      "fontFamily": "\"游ゴシック体\", \"Yu Gothic\", \"メイリオ\", Meiryo, sans-serif",
      "puppeteerConfigFile": {
        "args": ["--no-sandbox"]
      }
    };
    const configPath = path.join('/tmp', `mmdc-config-${Date.now()}.json`);
    await fs.writeFile(configPath, JSON.stringify(mmdcConfig));

    const command = `${mmdcPath} -i ${tempInputPath} -o ${tempOutputPath} -t ${theme || 'default'} -s ${scale || 2} -c ${configPath}`;

    await new Promise<void>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`mmdc exec error: ${error}`);
          console.error(`mmdc stderr: ${stderr}`);
          reject(new Error(`Failed to generate PNG: ${stderr}`));
          return;
        }
        resolve();
      });
    });

    // --- 生成されたPNGを読み込んでレスポンスとして返す --- //
    const imageBuffer = await fs.readFile(tempOutputPath);

    // --- 一時ファイルを削除 --- //
    await fs.unlink(tempInputPath);
    await fs.unlink(tempOutputPath);
    await fs.unlink(configPath);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="diagram.png"',
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}