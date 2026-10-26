import type { FieldId, Question, SectionSpec } from "../data/types";
import { sample, type Rng } from "./random";

/**
 * 本試験の分野比率（blueprint）に合わせて、問題集から模試の問題を選ぶ。
 *
 * - size が本試験の問題数と違うときは、比率を保って按分する
 * - ある分野の問題が足りないときは、その分野はあるだけ出し、残りは他の分野から補う
 */
export function buildMockSet(pool: Question[], spec: SectionSpec, size: number, rng: Rng = Math.random): Question[] {
  const fields = Object.keys(spec.blueprint) as FieldId[];
  const byField = new Map<FieldId, Question[]>(fields.map((f) => [f, pool.filter((q) => q.field === f)]));
  const target = Math.min(size, pool.length);

  // 1) 比率で按分（切り捨て）してから、端数を比率の大きい分野から配る
  const quotas = new Map<FieldId, number>();
  let assigned = 0;
  for (const f of fields) {
    const n = Math.floor((target * (spec.blueprint[f] ?? 0)) / spec.count);
    quotas.set(f, n);
    assigned += n;
  }
  const order = fields.slice().sort((a, b) => (spec.blueprint[b] ?? 0) - (spec.blueprint[a] ?? 0));
  for (let i = 0; assigned < target; i = (i + 1) % order.length) {
    quotas.set(order[i], (quotas.get(order[i]) ?? 0) + 1);
    assigned++;
  }

  // 2) 足りない分野を切り詰め、余りを他の分野へ回す
  let leftover = 0;
  for (const f of fields) {
    const avail = byField.get(f)!.length;
    const want = quotas.get(f)!;
    if (want > avail) {
      leftover += want - avail;
      quotas.set(f, avail);
    }
  }
  for (const f of order) {
    if (leftover === 0) break;
    const room = byField.get(f)!.length - quotas.get(f)!;
    const add = Math.min(room, leftover);
    quotas.set(f, quotas.get(f)! + add);
    leftover -= add;
  }

  // 3) 分野ごとに抜き出し、本試験と同じ順（blueprint の順）で並べる
  const picked: Question[] = [];
  for (const f of fields) picked.push(...sample(byField.get(f)!, quotas.get(f)!, rng));
  return picked;
}

/** 問題数に応じた制限時間（秒）。本試験のペースを保つ */
export function timeLimitFor(spec: SectionSpec, size: number) {
  return Math.round((spec.minutes * 60 * size) / spec.count);
}
