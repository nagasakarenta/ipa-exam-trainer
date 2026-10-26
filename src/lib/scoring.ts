import type { FieldId, SectionSpec } from "../data/types";

export interface Tally {
  correct: number;
  total: number;
}

export interface ScoreResult {
  correct: number;
  total: number;
  /** 正答率（0〜1） */
  rate: number;
  /** 1000点満点の簡易換算。本試験は IRT 方式なので目安 */
  estimated: number;
  byField: Partial<Record<FieldId, Tally & { estimated: number }>>;
  passed: boolean;
  /** 不合格の理由（合格なら空） */
  reasons: string[];
}

export function tallyToEstimated(t: Tally) {
  return t.total === 0 ? 0 : Math.round((t.correct / t.total) * 1000);
}

export function score(
  answers: { field: FieldId; correct: boolean }[],
  spec: Pick<SectionSpec, "passScore" | "fieldFloor">,
): ScoreResult {
  const byField: ScoreResult["byField"] = {};
  let correct = 0;
  for (const a of answers) {
    const t = (byField[a.field] ??= { correct: 0, total: 0, estimated: 0 });
    t.total++;
    if (a.correct) {
      t.correct++;
      correct++;
    }
  }
  for (const t of Object.values(byField)) t.estimated = tallyToEstimated(t);

  const total = answers.length;
  const estimated = tallyToEstimated({ correct, total });
  const reasons: string[] = [];
  if (total === 0) reasons.push("解答がありません");
  if (estimated < spec.passScore) reasons.push(`総合 ${estimated} 点が合格基準 ${spec.passScore} 点に届いていません`);
  if (spec.fieldFloor !== undefined) {
    for (const [field, t] of Object.entries(byField)) {
      if (t.estimated < spec.fieldFloor) reasons.push(`${field} の ${t.estimated} 点が分野別基準 ${spec.fieldFloor} 点に届いていません`);
    }
  }
  return {
    correct,
    total,
    rate: total === 0 ? 0 : correct / total,
    estimated,
    byField,
    passed: reasons.length === 0,
    reasons,
  };
}

/** 秒を「m分s秒」に */
export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${String(s).padStart(2, "0")}秒` : `${s}秒`;
}

/** 残り時間を mm:ss に */
export function formatClock(sec: number) {
  const s = Math.max(0, sec);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
