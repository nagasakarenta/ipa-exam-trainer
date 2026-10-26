import type { Card } from "./srs";
import type { ExamId, FieldId, SectionId } from "../data/types";

export type Mode = "drill" | "mock" | "review";

export interface Attempt {
  /** 問題ID */
  q: string;
  /** 選んだ添字。時間切れなどで未回答なら -1 */
  choice: number;
  correct: boolean;
  /** 解いた日時（ms） */
  at: number;
  mode: Mode;
}

export interface MockResult {
  id: string;
  exam: ExamId;
  section: SectionId;
  at: number;
  durationSec: number;
  size: number;
  correct: number;
  estimated: number;
  passed: boolean;
  byField: Partial<Record<FieldId, { correct: number; total: number }>>;
}

export interface Settings {
  /** 選択肢の順番を毎回入れ替える */
  shuffleChoices: boolean;
}

export interface Progress {
  version: 1;
  attempts: Attempt[];
  cards: Record<string, Card>;
  mocks: MockResult[];
  settings: Settings;
}

export const STORAGE_KEY = "ipa-exam-trainer:v1";

export function emptyProgress(): Progress {
  return { version: 1, attempts: [], cards: {}, mocks: [], settings: { shuffleChoices: true } };
}

export function loadProgress(storage: Pick<Storage, "getItem"> | undefined = safeStorage()): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress, storage: Pick<Storage, "setItem"> | undefined = safeStorage()) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* 容量超過やプライベートモードでは保存しない */
  }
}

/** 取り込んだ JSON を安全な形に直す。壊れていれば例外 */
export function normalize(input: unknown): Progress {
  if (!input || typeof input !== "object") throw new Error("形式が違います");
  const o = input as Partial<Progress>;
  const base = emptyProgress();
  return {
    version: 1,
    attempts: Array.isArray(o.attempts)
      ? o.attempts.filter((a) => a && typeof a.q === "string" && typeof a.correct === "boolean" && typeof a.at === "number")
      : base.attempts,
    cards: o.cards && typeof o.cards === "object" ? o.cards : base.cards,
    mocks: Array.isArray(o.mocks) ? o.mocks : base.mocks,
    settings: { ...base.settings, ...(o.settings ?? {}) },
  };
}

export function exportProgress(p: Progress) {
  return JSON.stringify(p, null, 2);
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
