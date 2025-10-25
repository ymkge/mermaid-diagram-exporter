# Mermaid Diagram Exporter (Web App)  
<img width="1336" height="761" alt="スクリーンショット 2025-10-08 22 16 50" src="https://github.com/user-attachments/assets/da925cd8-0ba9-4e12-8d3a-4257ca178de8" />

## 概要

[Mermaid](https://mermaid-js.github.io/mermaid/#/) で記述されたフロー図やダイアグラムを、PNG, SVG, PDF画像として簡単にエクスポートしたり、クリップボードにコピーしたりするためのWebアプリケーションです。

JOBフロー図などの視覚化されたプロセスを、ドキュメントやプレゼンテーションに簡単に貼り付けられる形式で保存することを目的としています。

## 主な機能

- **高機能エディタ**: シンタックスハイライトや自動補完が効くMonaco Editorを搭載。
- **サンプルコード**: フローチャート、シーケンス図、ガントチャートなどのサンプルをドロップダウンから簡単に挿入できます。
- **自動ライブプレビュー**: 入力されたコードを即座にレンダリングし、プレビューを自動更新します。**プレビューの背景は常に明るい色（薄いグレー）に固定され、視認性を確保します。**
- **テーマ選択**: `default`, `dark`, `forest`, `neutral` などのテーマを切り替えて、ダイアグラムの見た目を変更できます。**このテーマは主にエクスポートされる画像に適用されます。**
- **多彩なエクスポート形式**: レンダリングされたダイアグラムを、**SVG**, **PNG**, **PDF**形式でダウンロードできます。
- **クリップボードへのコピー**: プレビュー画像を直接クリップボードにコピーして、他のアプリケーションに簡単に貼り付けられます。
- **高解像度出力**: PNGやクリップボードへのコピー時に、解像度（スケール）を選択して、鮮明な画像を出力できます。

## 使い方

1. アプリケーションのURLにアクセスします。
2. 左側のエディタにMermaid形式のコードを入力するか、上部の **「サンプル」** ドロップダウンから好きな図を選択します。
3. コードを編集すると、右側のプレビューエリアが自動で更新されます。
4. 上部のドロップダウンメニューから、お好みの **エクスポートテーマ** や **エクスポート解像度** を選択します。
5. **「SVG保存」**, **「PDF保存」**, **「PNG保存」** ボタンをクリックすると、各種形式で画像ファイルがダウンロードされます。
6. **「コピー」** ボタンをクリックすると、プレビュー画像がクリップボードにコピーされます。

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (React)
- **UI**: [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **ダイアグラムレンダリング**: [Mermaid.js](https://mermaid-js.github.io/mermaid/#/) (クライアントサイド), [Puppeteer](https://pptr.dev/) (サーバーサイド)
- **PNG/PDF生成**: [puppeteer-core](https://pptr.dev/), [@sparticuz/chromium](https://github.com/Sparticuz/chromium)
- **コードエディタ**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **アイコン**: [Lucide React](https://lucide.dev/)
- **通知**: [Sonner](https://sonner.emilkowal.ski/)
- **テーマ管理**: [next-themes](https://github.com/pacocoursey/next-themes)

## 処理フロー

このアプリケーションの主要な処理フローは以下の通りです。

```mermaid
flowchart TD
    subgraph "フロントエンド (ブラウザ)"
        A[ユーザーがEditorにMermaid記法を入力] --> B{useMermaidフック};
        B --> C[クライアントサイドでSVGを生成];
        C --> D[PreviewにSVGをリアルタイム表示];
        E[ユーザーがエクスポート/コピーボタンをクリック] --> F["APIルートを呼び出す<br>/api/generate-png, /api/generate-pdf"];
    end

    subgraph "バックエンド (Next.js API Route)"
        F --> G[APIルートがリクエストを受信];
        G --> H[PuppeteerとChromiumで仮想ブラウザを起動];
        H --> I[仮想ブラウザ上でMermaid.jsを実行し、図を描画];
        I --> J[ページをスクリーンショット or PDF化];
    end

    subgraph "フロントエンド (ブラウザ)"
        J --> K[生成されたファイル/データをレスポンスとして受信];
        K --> L[ファイルをダウンロード or クリップボードにコピー];
    end

    style A fill:#590159,stroke:#590159,stroke-width:2px
    style E fill:#590159,stroke:#590159,stroke-width:2px
    style L fill:#590159,stroke:#590159,stroke-width:2px
```

## プロジェクト構造

リファクタリングにより、コードベースは役割ごとに分割されています。

- `app/` - Next.jsのApp Router。アプリケーションのエントリーポイント(`page.tsx`)とAPIルート(`api/`)が含まれます。
- `components/` - UIコンポーネント。
  - `ui/` - `shadcn/ui`によって自動生成された基本的なUI部品（Button, Cardなど）。
  - `app/` - アプリケーション固有の複合コンポーネント（Header, ControlPanelなど）。
- `hooks/` - カスタムフック。`use-mermaid.ts`に状態管理とビジネスロジックが集約されています。
- `lib/` - `shadcn/ui`が使用するユーティリティ関数が含まれます。

## ローカルでの開発方法

### 前提条件

- [Node.js](https://nodejs.org/) (LTS版を推奨) がインストールされていること。

### 手順

1.  **依存関係のインストール**
    プロジェクトのルートディレクトリで以下のコマンドを実行し、必要なライブラリをインストールします。
    ```bash
    npm install
    ```

2.  **開発サーバーの起動**
    インストール完了後、以下のコマンドで開発サーバーを起動します。
    ```bash
    npm run dev
    ```

3.  ブラウザで `http://localhost:3000` を開きます。

## 課題と経緯

### 【解決済み】Vercel環境でのPNG/PDF生成エラー

当初、PNG/PDF生成に`@mermaid-js/mermaid-cli`を利用していましたが、このライブラリがVercelのサーバーレス環境で動作しないという問題がありました。

この問題を解決するため、クライアントサイドでの画像生成など複数のアプローチを試みましたが、ブラウザ間の互換性やライブラリの不安定さにより、いずれも完全な解決には至りませんでした。

最終的に、サーバーサイドで動作するライブラリを、Vercel環境と互換性の高い`puppeteer-core`および`@sparticuz/chromium`に切り替えることで、この問題を解決しました。また、ローカル開発環境とVercel本番環境の両方で安定して動作するよう、環境に応じたブラウザ実行環境の切り替えロジックを導入しています。

### 【未解決】クリップボードへのコピー機能の不具合

- **問題**:
  現在、一部のブラウザ環境において、「コピー」ボタンを押すと「コピーしました」という成功メッセージが表示されるにも関わらず、実際にはクリップボードに画像が書き込まれない（貼り付けができない）という「サイレントフェイル」現象が確認されています。

- **原因の推測**:
  サーバーから返される画像データ自体は正常であることが確認できています。そのため、この問題はアプリケーションのコードに起因するものではなく、ブラウザのセキュリティポリシーや、OSとブラウザ間のクリップボード連携における稀な不具合である可能性が極めて高いと考えられます。

- **代替策**:
  この問題はアプリケーションコードでの解決が困難なため、代替手段として、一度 **「PNG保存」** ボタンで画像をPCにダウンロードし、そのファイルを直接コピー＆ペーストしていただく方法を推奨します。

### 【未解決】Vercel環境でのPNG/PDF/コピー機能のエラー (Chromiumが見つからない)

- **問題**: Vercelにデプロイ後、SVG以外のエクスポート機能（PNG, PDF, クリップボードコピー）が動作せず、以下のエラーが発生する。
  `API Error: Error: Browser was not found at the configured executablePath (./lib/mmdc-bin/chromium/chromium)`
- **経緯**:
  - Vercelでのビルドエラー（型競合、`headless`オプションの型不一致、`NextResponse`の型不一致）を解消するため、`puppeteer`への依存を`puppeteer-core`に一本化し、`vercel.json`やAPIルートのコードを複数回修正。
  - ローカル環境での`spawn`エラーを解消するため、ローカルのChrome実行パスを明示的に指定。
  - Vercelでの`@sparticuz/chromium`のファイルが見つからないエラー（`The input directory "/var/task/node_modules/@sparticuz/chromium/bin" does not exist.`）に対し、`vercel.json`の`installCommand`で`@sparticuz/chromium`のファイルを`lib/mmdc-bin/chromium`にコピーし、APIルートの`executablePath`を`./lib/mmdc-bin/chromium/chromium`に設定。
  - しかし、`executablePath`をコピー先のパスに設定しても、Vercelのランタイム環境でChromiumの実行可能ファイルが見つからない状況が続いている。
- **現状**: `installCommand`でファイルをコピーし、そのパスを`executablePath`に指定しているにも関わらず、Vercelのランタイム環境でChromiumの実行可能ファイルが見つからない状況が続いている。
- **Next Step**:
  1.  Vercelのビルドログを詳細に確認し、`installCommand`がエラーなく実行され、ファイルが期待通りにコピーされているかを検証する。特に、`cp -R`コマンドがVercelの環境で期待通りに動作しているか、コピー先のパスが正しいかを確認する。
  2.  APIルートの`executablePath`を、ハードコードされたパスではなく、`await chromium.executablePath()`に戻す。`@sparticuz/chromium`が`installCommand`でコピーされたファイル群の中から正しいパスを解決できるかを確認する。
  3.  もし上記で解決しない場合、`installCommand`でのコピー先を`node_modules/@sparticuz/chromium/bin`に直接変更し、`executablePath`は`await chromium.executablePath()`を使用する。ただし、`node_modules`内へのコピーは`npm audit fix`などで上書きされるリスクがあるため、注意が必要。

---

## 2025年10月24日のデバッグ記録

### 実施した対策

1.  **APIルートの`executablePath`を`await chromium.executablePath()`に変更**:
    *   `app/api/generate-pdf/route.ts` および `app/api/generate-png/route.ts` の `puppeteer.launch` オプション内の `executablePath` を、ハードコードされたパス (`./lib/mmdc-bin/chromium/chromium`) から `await chromium.executablePath()` に変更。
    *   これにより、`@sparticuz/chromium` が Chromium の実行パスを自動的に解決することを期待した。

2.  **`vercel.json`の`installCommand`を`npm install`のみに変更**:
    *   `vercel.json` 内の `installCommand` から、以前の手動での Chromium バイナリのコピーコマンド (`mkdir -p lib/mmdc-bin/chromium && cp -R node_modules/@sparticuz/chromium/bin/* lib/mmdc-bin/chromium`) を削除し、`npm install` のみとした。

3.  **`vercel.json`の`functions`セクションの`includeFiles`を`"node_modules/@sparticuz/chromium/bin/**"`に変更**:
    *   Vercel のサーバーレス関数に `@sparticuz/chromium` のバイナリがバンドルされることを期待し、`vercel.json` の `functions` セクション内の `includeFiles` を `"node_modules/@sparticuz/chromium/bin/**"` に設定。
    *   当初配列で指定したが、Vercel のスキーマバリデーションエラー (`includeFiles` should be string) が発生したため、単一の文字列に変更。

4.  **APIルートに`console.log(await chromium.executablePath())`を追加**:
    *   `app/api/generate-pdf/route.ts` および `app/api/generate-png/route.ts` 内に `console.log('Chromium executablePath:', await chromium.executablePath());` を追加し、Vercel のログで `@sparticuz/chromium` が返すパスを確認することを試みた。

### 結果

*   **ビルドは成功**した。
*   しかし、PNG、PDF、コピー機能を使用すると、以下の**APIエラーが継続して発生**した。
    ```
    API Error: Error: The input directory "/var/task/node_modules/@sparticuz/chromium/bin" does not exist. Please provide the location of the brotli files.
    ```
*   `console.log` の出力は、エラーがそのログが出力される前に発生したため、Vercel のログでは確認できなかった。

### 考察

*   `@sparticuz/chromium` が `executablePath()` を呼び出す時点で、`/var/task/node_modules/@sparticuz/chromium/bin` というディレクトリを見つけられていない。
*   `vercel.json` の `includeFiles` で `"node_modules/@sparticuz/chromium/bin/**"` を指定しても、Vercel のランタイム環境でこのパスが正しく認識されていないか、ファイルがバンドルされていない可能性が高い。
*   `@sparticuz/chromium` が内部的に期待するパスと、Vercel のサーバーレス環境での実際のファイル配置にミスマッチがあると考えられる。

### 次のデバッグの方向性

*   `@sparticuz/chromium` の GitHub リポジトリの Issue や Discussion をさらに深く調査し、Vercel でのデプロイに関する具体的な問題報告や解決策を探す。
*   Vercel の公式ドキュメントで、`includeFiles` の動作や、`node_modules` 内のファイルをバンドルする際の注意点を確認する。
*   `@sparticuz/chromium` の `executablePath()` が返すパスを、Vercel のランタイム環境で実際にファイルが存在するパスに手動でマッピングするアプローチ（`installCommand`で特定のディレクトリにコピーし、`executablePath`をそのコピー先のパスにハードコードする）を再検討する必要があるかもしれない。ただし、このアプローチは `npm audit fix` などで上書きされるリスクがあるため、慎重に進める。