import type { Attempt } from "./storage";
import type { Question } from "../data/types";
import { DAY_MS } from "./srs";

export interface Tally {
  correct: number;
  total: number;
}

export function tally(attempts: Attempt[]): Tally {
  let correct = 0;
  for (const a of attempts) if (a.correct) correct++;
  return { correct, total: attempts.length };
}

export function rate(t: Tally) {
  return t.total === 0 ? 0 : t.correct / t.total;
}

/** 属性ごとの正答数（分野・中分類・論点など） */
export function groupTally(attempts: Attempt[], questions: Map<string, Question>, key: (q: Question) => string) {
  const map = new Map<string, Tally>();
  for (const a of attempts) {
    const q = questions.get(a.q);
    if (!q) continue;
    const k = key(q);
    const t = map.get(k) ?? { correct: 0, total: 0 };
    t.total++;
    if (a.correct) t.correct++;
    map.set(k, t);
  }
  return map;
}

/** 弱点：解いた回数が minTotal 以上で、正答率が低い順 */
export function weakest(groups: Map<string, Tally>, minTotal = 2, limit = 10) {
  return [...groups.entries()]
    .filter(([, t]) => t.total >= minTotal)
    .sort((a, b) => rate(a[1]) - rate(b[1]) || b[1].total - a[1].total)
    .slice(0, limit);
}

/** 日付（ローカル）のキー YYYY-MM-DD */
export function dayKey(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 直近 days 日の日別の解答数 */
export function dailyCounts(attempts: Attempt[], days: number, now = Date.now()) {
  const out: { day: string; total: number; correct: number }[] = [];
  const index = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(now - i * DAY_MS);
    index.set(key, out.length);
    out.push({ day: key, total: 0, correct: 0 });
  }
  for (const a of attempts) {
    const i = index.get(dayKey(a.at));
    if (i === undefined) continue;
    out[i].total++;
    if (a.correct) out[i].correct++;
  }
  return out;
}

/** 連続学習日数（今日か昨日から数える） */
export function streak(attempts: Attempt[], now = Date.now()) {
  const days = new Set(attempts.map((a) => dayKey(a.at)));
  let count = 0;
  let cursor = now;
  if (!days.has(dayKey(cursor))) {
    cursor -= DAY_MS;
    if (!days.has(dayKey(cursor))) return 0;
  }
  while (days.has(dayKey(cursor))) {
    count++;
    cursor -= DAY_MS;
  }
  return count;
}
