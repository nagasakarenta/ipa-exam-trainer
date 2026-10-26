import { describe, expect, it } from "vitest";
import type { Question, SectionSpec } from "../data/types";
import { buildMockSet, timeLimitFor } from "./mock";
import { createRng } from "./random";

const spec: SectionSpec = {
  id: "ip",
  exam: "ip",
  name: "ITパスポート",
  count: 100,
  minutes: 120,
  blueprint: { strategy: 35, management: 20, technology: 45 },
  passScore: 600,
};

function make(field: Question["field"], n: number): Question[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${field}-${i}`,
    exam: "ip",
    section: "ip",
    field,
    subfield: "x",
    topic: "t",
    text: "q",
    choices: ["a", "b", "c", "d"],
    answer: 0,
    explanation: "e",
  }));
}

describe("buildMockSet", () => {
  it("本番の分野比率で按分する", () => {
    const pool = [...make("strategy", 50), ...make("management", 50), ...make("technology", 50)];
    const set = buildMockSet(pool, spec, 20, createRng(1));
    const count = (f: string) => set.filter((q) => q.field === f).length;
    expect(set).toHaveLength(20);
    expect(count("strategy")).toBe(7);
    expect(count("management")).toBe(4);
    expect(count("technology")).toBe(9);
  });

  it("足りない分野は他の分野で補い、重複は出さない", () => {
    const pool = [...make("strategy", 2), ...make("management", 50), ...make("technology", 50)];
    const set = buildMockSet(pool, spec, 20, createRng(1));
    expect(set).toHaveLength(20);
    expect(set.filter((q) => q.field === "strategy")).toHaveLength(2);
    expect(new Set(set.map((q) => q.id)).size).toBe(20);
  });

  it("問題集が小さければあるだけ出す", () => {
    const pool = [...make("strategy", 3), ...make("technology", 3)];
    expect(buildMockSet(pool, spec, 100, createRng(1))).toHaveLength(6);
  });

  it("分野の順（blueprint の順）で並ぶ", () => {
    const pool = [...make("technology", 10), ...make("strategy", 10), ...make("management", 10)];
    const fields = buildMockSet(pool, spec, 12, createRng(3)).map((q) => q.field);
    const firstTech = fields.indexOf("technology");
    const lastStrategy = fields.lastIndexOf("strategy");
    expect(lastStrategy).toBeLessThan(firstTech);
  });

  it("制限時間は本番と同じペース", () => {
    expect(timeLimitFor(spec, 100)).toBe(7200);
    expect(timeLimitFor(spec, 50)).toBe(3600);
    expect(timeLimitFor(spec, 10)).toBe(720);
  });
});
