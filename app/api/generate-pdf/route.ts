import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const isDev = process.env.NODE_ENV === 'development';

export async function POST(request: Request) {
  try {
    const { code, theme } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Mermaid code is required' }, { status: 400 });
    }

    let browser;

    if (isDev) {
      const puppeteerFull = (await import('puppeteer')).default;
      browser = await puppeteerFull.launch({ headless: true });
    } else {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    }

    const page = await browser.newPage();

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; }
            .mermaid { display: inline-block; }
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

    const dimensions = await page.evaluate(() => {
      const el = document.querySelector('.mermaid svg');
      if (!el) return null;
      const { width, height } = el.getBoundingClientRect();
      return { width, height };
    });

    if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
      throw new Error('Could not get valid dimensions from rendered Mermaid diagram.');
    }

    const pdfBuffer = await page.pdf({
      width: `${Math.ceil(dimensions.width)}px`,
      height: `${Math.ceil(dimensions.height)}px`,
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="diagram.pdf"',
      },
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
