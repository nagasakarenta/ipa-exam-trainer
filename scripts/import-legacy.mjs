#!/usr/bin/env node
/**
 * 旧「実力テスト」ページの問題データ（`const SETS = {...}` 形式の JS）を、
 * このアプリの JSON 形式（docs/question-format.md）に変換する。
 *
 * 使い方:
 *   node scripts/import-legacy.mjs <実力テスト_問題データ.js> [出力ディレクトリ]
 *
 * - 科目Bのセット（下の SECTION_B_SETS）は fe-b、それ以外は fe-a として出力する
 * - 問題文が PDF 参照だけで選択肢が空のセット（ss）は取り込まない
 * - 同じ問題文は最初の1問だけ残す
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , input, outDir = "src/data/questions"] = process.argv;
if (!input) {
  console.error("usage: node scripts/import-legacy.mjs <問題データ.js> [outDir]");
  process.exit(1);
}

const src = readFileSync(input, "utf8");
// ファイルは `const SETS = {...};` だけを含む想定。評価して取り出す。
const SETS = new Function(`${src}; return SETS;`)();

const SECTION_B_SETS = new Set(["b1", "b2", "r8", "fb1", "fb2", "fb3", "fb4", "ss", "m1", "sb"]);
const SKIP_SETS = new Set(["ss"]);

const FIELD_A = { T: "technology", M: "management", S: "strategy", C: "technology" };
const FIELD_B = { A: "algorithm", C: "security" };

/** 科目A の中分類を、論点名と問題文のキーワードから推定する（順番に意味がある） */
const SUBFIELD_RULES = [
  ["企業と法務", /損益分岐|目標利益|請負|著作権|労働者派遣|電子署名法|法|契約/],
  ["経営戦略", /ファイブフォース|PPM|デルファイ|回収期間|SWOT|マーケティング|投資/],
  ["システム戦略", /IaaS|PaaS|SaaS|To-Be|BYOD|クラウドと委託|EA\b/],
  ["サービスマネジメント", /監査|内部統制|コンティンジェンシー|インシデント|可用性の計算|SLA|サービス/],
  ["プロジェクトマネジメント", /クリティカルパス|要員|EVM|プレシデンス|WBS|工数|アロー/],
  ["開発技術", /モジュール|限界値|網羅|テスト|UML|エラー埋込|ファンクションポイント|保守性|スクラム|コードの種類|入力のチェック|チェックディジット|アジャイル/],
  ["コンピュータシステム", /バックアップサイト|ホットサイト|ウォームサイト|コールドサイト/],
  ["技術要素", /正規|SQL|ロールフォワード|障害回復|回復|トランザクション|原子性|ACID|主キー|外部キー|参照制約|射影|結合|選択|タプル|多対多|ビュー|分析に使う表|Hadoop|サブネット|ARP|DHCP|プロトコル|層|ルータ|スイッチ|ブリッジ|リピータ|ゲートウェイ|ポート番号|ブロードキャスト|TCP|\bIP\b|メール|SDN|鍵|署名|暗号|XSS|CSRF|攻撃|ファイアウォール|WAF|DMZ|IDS|SIEM|セッション|MAC|ステガノグラフィ|JPCERT|ランサム|ログイン|リスク対応|RTO|音声|量子化|標本化|GUI|UTF-8|エンベロープ|ネットワーク|Web|セキュリティ|バックアップ|アクセス/],
  ["コンピュータシステム", /MIPS|キャッシュ|稼働率|フェール|ページ|LRU|DRAM|SRAM|RAID|再入|再使用|再○○|インタプリタ|リンカ|言語プロセッサ|磁気ディスク|メモリ|サイト|使用率|応答時間|待ち行列|LED|パス|プリンタ|クライアントサーバ|OS|CPU|仮想/],
  ["基礎理論", /.*/],
];

function guessSubfield(field, topic, text) {
  if (field === "management") return pickFrom(["サービスマネジメント", "プロジェクトマネジメント", "開発技術"], topic, text) ?? "プロジェクトマネジメント";
  if (field === "strategy") return pickFrom(["企業と法務", "経営戦略", "システム戦略"], topic, text) ?? "経営戦略";
  return pickFrom(["開発技術", "技術要素", "コンピュータシステム", "基礎理論"], topic, text) ?? "基礎理論";
}
function pickFrom(allowed, topic, text) {
  for (const [name, re] of SUBFIELD_RULES) {
    if (!allowed.includes(name)) continue;
    if (re.test(topic) || (name !== "基礎理論" && re.test(text.slice(0, 80)))) return name;
  }
  return undefined;
}

/** 「確かめ：」「新しい範囲：」「（3回目）」のような、学習記録用の飾りを取る */
function cleanTopic(topic) {
  return topic
    .replace(/^(確かめ|新しい範囲)：/, "")
    .replace(/（\d+回目）$/, "")
    .trim();
}

const out = { "fe-a": [], "fe-b": [] };
const seen = new Set();
let skipped = 0;

for (const [setId, set] of Object.entries(SETS)) {
  if (SKIP_SETS.has(setId)) { skipped += set.q.length; continue; }
  const isB = SECTION_B_SETS.has(setId);
  for (const q of set.q) {
    if (!q.o?.length || q.o.some((c) => !String(c).trim())) { skipped++; continue; }
    const key = q.t.replace(/\s+/g, "");
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);

    const field = isB ? FIELD_B[q.f] : FIELD_A[q.f];
    if (!field) throw new Error(`unknown field code ${q.f} in ${setId}`);
    const section = isB ? "fe-b" : "fe-a";
    const topic = cleanTopic(q.topic);
    const subfield = isB
      ? (field === "security" ? "情報セキュリティ" : "アルゴリズムとプログラミング")
      : guessSubfield(field, topic, q.t);

    const item = {
      id: "", // あとで連番を振る
      exam: "fe",
      section,
      field,
      subfield,
      topic,
      text: q.t,
      ...(q.sub ? { sub: q.sub } : {}),
      ...(q.code ? { code: q.code } : {}),
      choices: q.o.map(String),
      answer: q.ans,
      explanation: q.ex,
      source: { set: setId, title: set.title },
    };
    out[section].push(item);
  }
}

mkdirSync(outDir, { recursive: true });
for (const [section, items] of Object.entries(out)) {
  items.forEach((it, i) => { it.id = `${section}-${String(i + 1).padStart(3, "0")}`; });
  writeFileSync(join(outDir, `${section}.json`), JSON.stringify(items, null, 2) + "\n");
  const byField = {};
  for (const it of items) byField[`${it.field}/${it.subfield}`] = (byField[`${it.field}/${it.subfield}`] || 0) + 1;
  console.log(`${section}: ${items.length}問`, byField);
}
console.log(`skipped: ${skipped}`);
