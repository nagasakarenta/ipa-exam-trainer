import { describe, expect, it } from "vitest";
import type { Question } from "../data/types";
import type { Attempt } from "./storage";
import { dailyCounts, groupTally, streak, weakest } from "./stats";
import { DAY_MS } from "./srs";

const q = (id: string, topic: string): Question => ({
  id, exam: "ip", section: "ip", field: "technology", subfield: "s", topic, text: "", choices: ["a", "b"], answer: 0, explanation: "",
});
const at = (id: string, correct: boolean, when: number): Attempt => ({ q: id, correct, choice: 0, at: when, mode: "drill" });

describe("stats", () => {
  const now = new Date(2026, 9, 26, 12).getTime();
  const qs = new Map([q("a", "補数"), q("b", "正規化"), q("c", "SQL")].map((x) => [x.id, x]));

  it("論点ごとに集計し、苦手な順に並べる", () => {
    const g = groupTally([at("a", true, now), at("a", false, now), at("b", false, now), at("b", false, now), at("c", true, now)], qs, (x) => x.topic);
    expect(g.get("補数")).toEqual({ correct: 1, total: 2 });
    expect(weakest(g, 2).map(([k]) => k)).toEqual(["正規化", "補数"]);
  });

  it("日別の件数は直近 N 日分を日付順に返す", () => {
    const d = dailyCounts([at("a", true, now), at("a", false, now - DAY_MS), at("a", true, now - 30 * DAY_MS)], 3, now);
    expect(d.map((x) => x.total)).toEqual([0, 1, 1]);
    expect(d[2].correct).toBe(1);
  });

  it("連続学習日数は今日または昨日から数える", () => {
    expect(streak([at("a", true, now), at("a", true, now - DAY_MS), at("a", true, now - 2 * DAY_MS)], now)).toBe(3);
    expect(streak([at("a", true, now - DAY_MS)], now)).toBe(1);
    expect(streak([at("a", true, now - 2 * DAY_MS)], now)).toBe(0);
    expect(streak([], now)).toBe(0);
  });
});
