# IPA 試験トレーナー

[![CI](https://github.com/nagasakarenta/ipa-exam-trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/nagasakarenta/ipa-exam-trainer/actions/workflows/ci.yml)
[![Deploy](https://github.com/nagasakarenta/ipa-exam-trainer/actions/workflows/deploy.yml/badge.svg)](https://github.com/nagasakarenta/ipa-exam-trainer/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ITパスポート試験・基本情報技術者試験**に合格するための学習 Web アプリです。
「解く → 間違いを復習する → 模試で確かめる」を 1 つの画面で回せます。

**▶ デモ: https://nagasakarenta.github.io/ipa-exam-trainer/**

サーバ不要・インストール不要。学習データはブラウザに保存され、サーバには送られません。

## 背景

作者は 2026 年 10 月に、ITパスポート（10/7）と基本情報技術者（10/22）を連続して受験し、どちらも合格基準を満たしました（基本情報は勉強開始から 16 日目）。
そのとき自分用に作って回していた「オリジナル問題の実力テスト」「間違えた論点の記録」「本番形式の模試」を、誰でも使える形に設計し直したものがこのアプリです。

収録している基本情報の問題は、そのときに実際に作って解いた **434 問のオリジナル問題**を変換して取り込んでいます（`scripts/import-legacy.mjs`）。

## できること

| 機能 | 内容 |
|---|---|
| **分野別ドリル** | 区分（ITパスポート / 科目A / 科目B）→ 分野 → 中分類で絞って出題。1 問ごとに正誤と解説。「苦手な問題から」「まだ解いていない問題から」の並べ替え |
| **模擬試験** | 本試験と同じ分野比率・同じペースの制限時間。問題間を自由に移動、「あとで見る」の印、時間切れで自動採点。1000 点満点の目安と合否ライン（ITパスポートは分野別の足切りも）を判定 |
| **復習（間隔反復）** | 解いた問題は SM-2 を単純化した方式で次に出す日を決める。間違えた問題は当日中にもう一度。期限超過・忘れた回数の多い順に並ぶ |
| **学習記録** | 分野・中分類・論点ごとの正答率、苦手な論点トップ 10、直近 14 日の解答数、連続学習日数、模試の履歴 |
| **データの持ち運び** | JSON の書き出し・読み込み。選択肢の順番の入れ替え（位置で覚えてしまうのを防ぐ） |
| **キーボード操作** | `1`〜`9` で選択、`Enter` / `→` で次へ、`←` で前へ |
| **モーション** | 画面遷移のフェード、問題ごとのスライドイン、正解のポップ・不正解のシェイク、結果のスコアリングと数字のカウントアップ、合格ライン到達時の紙吹雪。OS の「視差効果を減らす」設定を尊重 |

## 収録問題

すべてオリジナル問題です（IPA の公開問題の転載ではありません）。

| 区分 | 問題数 | 内訳 |
|---|---:|---|
| ITパスポート | 84 | ストラテジ系 28・マネジメント系 20・テクノロジ系 36 |
| 基本情報 科目A | 322 | テクノロジ系 268・マネジメント系 31・ストラテジ系 23 |
| 基本情報 科目B | 84 | アルゴリズムとプログラミング 68・情報セキュリティ 16 |
| 合計 | **490** | |

問題の追加方法は [docs/question-format.md](docs/question-format.md) にあります。JSON を 1 ファイル置くだけで、分野・中分類の絞り込みや模試の按分に自動で反映されます。形式の誤り（正解の添字のずれ、ID の重複、選択肢の空など）は CI のテストで検出します。

## 技術

| 項目 | 選択 |
|---|---|
| フロントエンド | React 19 + TypeScript（strict）+ Vite 8 |
| ルーティング | react-router（HashRouter。GitHub Pages のサブパスで動くため） |
| 状態管理 | `useReducer` + Context（reducer は純粋関数） |
| 保存 | `localStorage`（バージョン付き、取り込み時に検証） |
| テスト | Vitest + Testing Library。**526 件**（ロジックの単体テスト、全 490 問のデータ検証、画面のスモークテスト） |
| Lint / 型 | oxlint、`tsc -b` |
| CI / CD | GitHub Actions（lint → 型 → テスト → ビルド、main への push で GitHub Pages に自動デプロイ） |
| モーション | CSS アニメーション + `requestAnimationFrame`（ライブラリなし）。画面遷移、出題のスライドイン、正誤のポップ／シェイク、スコアリングとカウントアップ、合格時の紙吹雪。`prefers-reduced-motion` に対応 |
| 依存 | 実行時依存は react / react-dom / react-router-dom の 3 つだけ |

設計上の判断（なぜ SM-2 を単純化したか、模試の按分アルゴリズム、採点を「簡易換算」と明記する理由など）は [docs/architecture.md](docs/architecture.md) にまとめています。

### ディレクトリ

```
src/
├─ data/          問題集（questions/*.json）と試験の仕様（分野比率・合格基準）
├─ lib/           UI に依存しない純粋なロジック（srs / mock / scoring / stats / random / storage）
├─ state/         学習データの reducer と Provider
├─ components/    出題エンジン（Quiz）・結果表示（Results）・レイアウト
└─ pages/         ホーム / 分野別ドリル / 模擬試験 / 復習 / 学習記録 / 設定
scripts/          旧データの変換スクリプト
docs/             問題の形式、設計メモ
.github/          CI とデプロイ
```

## 開発

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # テスト
npm run lint       # oxlint
npm run typecheck  # tsc
npm run build      # dist/ に出力
```

## 免責

- 問題と解説は作者が作成したもので、正確さには注意を払っていますが、誤りがあれば [Issue](https://github.com/nagasakarenta/ipa-exam-trainer/issues) でお知らせください
- 推定点は正答率からの簡易換算です。本試験は IRT 方式で評価点を出すため、目安としてお使いください
- 本アプリは独立行政法人情報処理推進機構（IPA）とは無関係です。「ITパスポート試験」「基本情報技術者試験」は IPA が実施する国家試験の名称です

## ライセンス

[MIT](LICENSE)

---

### English summary

**IPA Exam Trainer** is a serverless study app for two Japanese national IT certification exams, *IT Passport* and *Fundamental Information Technology Engineer (FE)*.
It bundles 490 original questions and offers category drills with instant explanations, timed mock exams that follow the official field ratios and pass criteria, spaced-repetition review (a simplified SM-2), and per-topic weakness analytics. Progress lives in `localStorage` and can be exported as JSON.
Built with React 19, TypeScript (strict) and Vite; 526 Vitest tests cover the core logic and validate every question; GitHub Actions runs CI and deploys to GitHub Pages.
