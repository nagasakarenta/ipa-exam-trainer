import { describe, expect, it } from "vitest";
import { emptyProgress } from "../lib/storage";
import { reducer } from "./reducer";

describe("reducer", () => {
  it("解答を記録すると復習カードもできる", () => {
    const s = reducer(emptyProgress(), { type: "answer", attempt: { q: "ip-s-001", choice: 0, correct: false, at: 1000, mode: "drill" } });
    expect(s.attempts).toHaveLength(1);
    expect(s.cards["ip-s-001"].lapses).toBe(1);
    expect(s.cards["ip-s-001"].due).toBe(1000);
  });

  it("模試の解答はまとめて記録される", () => {
    const s = reducer(emptyProgress(), {
      type: "answers",
      attempts: [
        { q: "a", choice: 0, correct: true, at: 1, mode: "mock" },
        { q: "a", choice: 0, correct: true, at: 2, mode: "mock" },
        { q: "b", choice: -1, correct: false, at: 2, mode: "mock" },
      ],
    });
    expect(s.attempts).toHaveLength(3);
    expect(s.cards["a"].interval).toBe(3);
    expect(s.cards["b"].interval).toBe(0);
  });

  it("設定の変更・初期化", () => {
    let s = reducer(emptyProgress(), { type: "settings", patch: { shuffleChoices: false } });
    expect(s.settings.shuffleChoices).toBe(false);
    s = reducer(s, { type: "reset" });
    expect(s).toEqual(emptyProgress());
  });
});
