# Just URL COPY FREE Chrome Extension

現在のページのURLを様々な形式で簡単にコピーできるChromeエクステンションです。

## 機能

### V1.0
- **3つのコピー形式**
  1. タイトル + URL形式: `ページタイトル - https://example.com/page`
  2. Markdown形式: `[ページタイトル](https://example.com/page)`
  3. HTML形式: `<a href="https://example.com/page">ページタイトル</a>`

- **シンプルな操作**
  - エクステンションアイコンをクリック
  - 希望の形式のボタンをクリック
  - 自動的にクリップボードにコピーされ、ポップアップが閉じる

## インストール方法

### 開発版でのインストール
1. このリポジトリをクローンまたはダウンロード
2. Chromeで `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このプロジェクトのフォルダを選択

### Chrome Web Store（予定）
- 公開準備中

## 使用方法

1. コピーしたいURLのページを開く
2. ブラウザのツールバーにある「Just URL COPY FREE」アイコンをクリック
3. 希望の形式のボタンをクリック
4. クリップボードにコピーされ、ポップアップが自動で閉じる

## 技術仕様

- Chrome Extension Manifest V3
- 必要な権限: `activeTab`, `clipboardWrite`
- 純粋なHTML/CSS/JavaScriptで実装
- 国際化対応（英語・日本語）

## 開発

### ファイル構成
```
copy-url/
├── manifest.json      # エクステンションの設定
├── popup.html         # ポップアップのHTML
├── popup.css          # ポップアップのスタイル
├── popup.js           # ポップアップのロジック
├── _locales/          # 国際化ファイル
│   ├── en/            # 英語
│   │   └── messages.json
│   └── ja/            # 日本語
│       └── messages.json
├── icons/             # アイコンファイル
└── README.md          # このファイル
```

### 必要なアイコン
- `icons/icon16.png` (16x16)
- `icons/icon32.png` (32x32)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

## 今後の予定

### V2.0
- カスタム形式の設定機能
- 履歴機能
- 設定画面

## ライセンス

MIT License

## 作者

[Your Name] 