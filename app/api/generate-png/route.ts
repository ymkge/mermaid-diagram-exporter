import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const isDev = process.env.NODE_ENV === 'development';

export async function POST(request: Request) {
  try {
    const { code, theme, scale = 2 } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Mermaid code is required' }, { status: 400 });
    }

    let browser;

    if (isDev) {
      browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: './lib/mmdc-bin/chromium',
        headless: true,
      });
    }

    const page = await browser.newPage();

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #fff; }
            .mermaid { padding: 20px; }
          </style>
        </head>
        <body>
          <div class="mermaid">${code}</div>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
          <script>
            mermaid.initialize({ startOnLoad: true, theme: '${theme || 'default'}' });
          </script>
        </body>
      </html>
    `);

    const dimensions = await page.evaluate((): { width: number; height: number } | null => {
      const el = document.querySelector('.mermaid svg');
      if (!el) return null;
      const { width, height } = el.getBoundingClientRect();
      return { width, height };
    });

    if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
      throw new Error('Could not get valid dimensions from rendered Mermaid diagram.');
    }

    const viewportWidth = Math.ceil(dimensions.width) + 40;
    const viewportHeight = Math.ceil(dimensions.height) + 40;
    await page.setViewport({ width: viewportWidth, height: viewportHeight, deviceScaleFactor: scale });

    const imageBuffer = await page.screenshot({
      clip: {
        x: 20,
        y: 20,
        width: Math.ceil(dimensions.width),
        height: Math.ceil(dimensions.height),
      },
      omitBackground: true,
    });

    await browser.close();

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="diagram.png"',
      },
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}