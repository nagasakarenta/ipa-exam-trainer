import { describe, expect, it } from "vitest";
import { STORAGE_KEY, emptyProgress, loadProgress, normalize, saveProgress } from "./storage";

function memory() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), map: m };
}

describe("storage", () => {
  it("保存して読み戻せる", () => {
    const s = memory();
    const p = emptyProgress();
    p.attempts.push({ q: "ip-s-001", choice: 1, correct: true, at: 1, mode: "drill" });
    saveProgress(p, s);
    expect(s.map.has(STORAGE_KEY)).toBe(true);
    expect(loadProgress(s)).toEqual(p);
  });

  it("壊れたデータなら空の状態で始める", () => {
    const s = memory();
    s.setItem(STORAGE_KEY, "{not json");
    expect(loadProgress(s)).toEqual(emptyProgress());
  });

  it("normalize は不正な解答を捨て、設定は既定値で埋める", () => {
    const p = normalize({ attempts: [{ q: "a", correct: true, at: 1 }, { q: 1 }, null], settings: {} });
    expect(p.attempts).toHaveLength(1);
    expect(p.settings.shuffleChoices).toBe(true);
    expect(p.cards).toEqual({});
    expect(() => normalize("x")).toThrow();
  });
});
