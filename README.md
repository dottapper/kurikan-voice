# 栗田貫一の読み聞かせ音声

栗田貫一さんによる絵本の読み聞かせ音声を再生するWebアプリケーションです。

## 特徴

- 🎵 **高品質音声再生**: WAV形式の音声ファイルをサポート
- 📱 **モバイル対応**: iPhone/Androidで最適化されたタッチ操作
- ♿ **アクセシビリティ**: スクリーンリーダー対応、キーボード操作サポート
- ⚡ **高速読み込み**: 軽量で高速なWebアプリケーション
- 🎨 **美しいUI**: 絵本読み聞かせに適した温かみのあるデザイン

## 機能

### 再生コントロール
- 再生/一時停止
- プログレスバーでのシーク操作
- 音量調整（ミュート機能付き）
- 再生速度変更（0.5倍速〜2.0倍速）

### キーボードショートカット
- `Space` / `Enter`: 再生/一時停止
- `←` / `→`: 10秒戻る/進む
- `↑` / `↓`: 音量上げる/下げる
- `M`: ミュート切り替え

### モバイル対応
- タッチ操作最適化
- iOS Safariの制限に対応
- レスポンシブデザイン

## セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/dottapper/Kazuichi-Kurita-s-audiobook-narration.git
cd Kazuichi-Kurita-s-audiobook-narration
```

2. ブラウザで開く
```bash
# ローカルサーバーを起動（推奨）
python -m http.server 8000
# または
npx serve .
```

3. ブラウザで `http://localhost:8000` にアクセス

## ファイル構成

```
├── index.html          # メインHTMLファイル
├── style.css           # スタイルシート
├── script.js           # JavaScript機能
├── Bikkuri Morinonaka_Mix250722.wav  # 音声ファイル
└── README.md           # このファイル
```

## 技術仕様

- **HTML5**: セマンティックマークアップ
- **CSS3**: モダンなスタイリング、レスポンシブデザイン
- **JavaScript (ES6+)**: モダンなJavaScript機能
- **Web Audio API**: 高品質音声再生
- **Touch Events**: モバイルタッチ操作

## ブラウザ対応

- ✅ Chrome (最新版)
- ✅ Safari (iOS 12+, macOS)
- ✅ Firefox (最新版)
- ✅ Edge (最新版)
- ✅ Samsung Internet (Android)

## ライセンス

このプロジェクトは教育目的で作成されています。

## 作者

栗田貫一さんの読み聞かせ音声を使用したWebアプリケーションです。 