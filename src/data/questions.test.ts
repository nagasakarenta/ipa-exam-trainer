import { describe, expect, it } from "vitest";
import { EXAMS, QUESTIONS, getSection } from "./index";

const FIELDS_OF_SECTION: Record<string, string[]> = {
  ip: ["strategy", "management", "technology"],
  "fe-a": ["strategy", "management", "technology"],
  "fe-b": ["algorithm", "security"],
};

describe("問題データ", () => {
  it("1問以上ある", () => {
    expect(QUESTIONS.length).toBeGreaterThan(400);
  });

  it("ID が重複していない", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(QUESTIONS.map((q) => [q.id, q] as const))("%s の形式が正しい", (_id, q) => {
    expect(getSection(q.section)?.exam).toBe(q.exam);
    expect(FIELDS_OF_SECTION[q.section]).toContain(q.field);
    expect(q.subfield.length).toBeGreaterThan(0);
    expect(q.topic.length).toBeGreaterThan(0);
    expect(q.text.trim().length).toBeGreaterThan(5);
    expect(q.choices.length).toBeGreaterThanOrEqual(2);
    for (const c of q.choices) expect(c.trim().length).toBeGreaterThan(0);
    expect(Number.isInteger(q.answer)).toBe(true);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThan(q.choices.length);
    expect(q.explanation.trim().length).toBeGreaterThan(5);
    for (const s of [q.text, q.sub ?? "", q.code ?? "", q.explanation, ...q.choices]) expect(s).not.toContain("</script>");
  });

  it("どの区分も、本試験の全分野の問題を含む", () => {
    for (const exam of EXAMS) {
      for (const s of exam.sections) {
        for (const f of Object.keys(s.blueprint)) {
          expect(QUESTIONS.some((q) => q.section === s.id && q.field === f), `${s.id}/${f}`).toBe(true);
        }
      }
    }
  });

  it("正解の位置が極端に偏っていない（ITパスポート）", () => {
    const ip = QUESTIONS.filter((q) => q.section === "ip");
    const dist = [0, 1, 2, 3].map((i) => ip.filter((q) => q.answer === i).length / ip.length);
    for (const r of dist) {
      expect(r).toBeGreaterThan(0.1);
      expect(r).toBeLessThan(0.45);
    }
  });
});
