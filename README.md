# Mermaid Diagram Exporter (Web App)

## 概要

[Mermaid](https://mermaid-js.github.io/mermaid/#/) で記述されたフロー図やダイアグラムを、PNG, SVG, PDF画像として簡単にエクスポートしたり、クリップボードにコピーしたりするためのWebアプリケーションです。

JOBフロー図などの視覚化されたプロセスを、ドキュメントやプレゼンテーションに簡単に貼り付けられる形式で保存することを目的としています。

## 主な機能

- **高機能エディタ**: シンタックスハイライトや自動補完が効くMonaco Editorを搭載。
- **サンプルコード**: フローチャート、シーケンス図、ガントチャートなどのサンプルをドロップダウンから簡単に挿入できます。
- **自動ライブプレビュー**: 入力されたコードを即座にレンダリングし、プレビューを自動更新します。
- **テーマ選択**: `default`, `dark`, `forest`, `neutral` などのテーマを切り替えて、ダイアグラムの見た目を変更できます。
- **多彩なエクスポート形式**: レンダリングされたダイアグラムを、**SVG**, **PNG**, **PDF**形式でダウンロードできます。
- **クリップボードへのコピー**: プレビュー画像を直接クリップボードにコピーして、他のアプリケーションに簡単に貼り付けられます。
- **高解像度出力**: PNGやクリップボードへのコピー時に、解像度（スケール）を選択して、鮮明な画像を出力できます。

## 使い方

1. アプリケーションのURLにアクセスします。
2. 左側のエディタにMermaid形式のコードを入力するか、上部の **「サンプル」** ドロップダウンから好きな図を選択します。
3. コードを編集すると、右側のプレビューエリアが自動で更新されます。
4. 上部のドロップダウンメニューから、お好みの **テーマ** や **エクスポート解像度** を選択します。
5. **「SVG保存」**, **「PDF保存」**, **「PNG保存」** ボタンをクリックすると、各種形式で画像ファイルがダウンロードされます。
6. **「コピー」** ボタンをクリックすると、プレビュー画像がクリップボードにコピーされます。

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (React)
- **UI**: [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **ダイアグラムレンダリング**: [Mermaid.js](https://mermaid-js.github.io/mermaid/#/)
- **PNG/PDF生成**: [@mermaid-js/mermaid-cli](https://github.com/mermaid-js/mermaid-cli)
- **コードエディタ**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **アイコン**: [Lucide React](https://lucide.dev/)
- **通知**: [Sonner](https://sonner.emilkowal.ski/)
- **テーマ管理**: [next-themes](https://github.com/pacocoursey/next-themes)

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

---

## 今後の開発タスク

- **レイアウト改善**: CodeとPreviewの表示を縦並びから横並びに変更し、視認性を向上させる。