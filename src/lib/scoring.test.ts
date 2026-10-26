import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, score } from "./scoring";

describe("score", () => {
  const ip = { passScore: 600, fieldFloor: 300 };

  it("正答率を 1000 点満点に換算し、分野別も出す", () => {
    const s = score(
      [
        { field: "strategy", correct: true },
        { field: "strategy", correct: false },
        { field: "technology", correct: true },
        { field: "technology", correct: true },
      ],
      ip,
    );
    expect(s.correct).toBe(3);
    expect(s.estimated).toBe(750);
    expect(s.byField.strategy?.estimated).toBe(500);
    expect(s.byField.technology?.estimated).toBe(1000);
    expect(s.passed).toBe(true);
  });

  it("総合が足りなければ不合格", () => {
    const s = score(
      [
        { field: "technology", correct: true },
        { field: "technology", correct: false },
      ],
      ip,
    );
    expect(s.passed).toBe(false);
    expect(s.reasons[0]).toContain("総合 500 点");
  });

  it("ITパスポートは分野別の足切りがある", () => {
    const s = score(
      [
        ...Array.from({ length: 9 }, () => ({ field: "technology" as const, correct: true })),
        { field: "management", correct: false },
      ],
      ip,
    );
    expect(s.estimated).toBe(900);
    expect(s.passed).toBe(false);
    expect(s.reasons.some((r) => r.includes("management"))).toBe(true);
  });

  it("基本情報には足切りがない", () => {
    const s = score(
      [
        ...Array.from({ length: 9 }, () => ({ field: "technology" as const, correct: true })),
        { field: "management", correct: false },
      ],
      { passScore: 600 },
    );
    expect(s.passed).toBe(true);
  });

  it("解答がなければ不合格", () => {
    expect(score([], ip).passed).toBe(false);
  });

  it("時間の表示", () => {
    expect(formatDuration(65)).toBe("1分05秒");
    expect(formatDuration(30)).toBe("30秒");
    expect(formatClock(5400)).toBe("90:00");
    expect(formatClock(-3)).toBe("00:00");
  });
});
