# Just URL COPY FREE

現在のページのURLを3つの形式でコピーするChromeエクステンションです。

## 機能

- タイトル + URL形式: `ページタイトル - https://example.com/page`
- Markdown形式: `[ページタイトル](https://example.com/page)`
- HTML形式: `<a href="https://example.com/page">ページタイトル</a>`

## インストール

1. このリポジトリをクローンまたはダウンロード
2. Chromeで `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このプロジェクトのフォルダを選択

## 使用方法

1. コピーしたいURLのページを開く
2. エクステンションアイコンをクリック
3. 希望の形式のボタンをクリック

## 技術仕様

- Chrome Extension Manifest V3
- 必要な権限: `activeTab`, `clipboardWrite`
- 国際化対応（英語・日本語）

## ファイル構成

```
copy-url/
├── manifest.json      # エクステンションの設定
├── popup.html         # ポップアップのHTML
├── popup.css          # ポップアップのスタイル
├── popup.js           # ポップアップのロジック
├── _locales/          # 国際化ファイル
│   ├── en/            # 英語
│   └── ja/            # 日本語
├── icons/             # アイコンファイル
└── README.md          # このファイル
``` 