import type { FieldId, Question, SectionId } from "./types";

// src/data/questions/*.json をビルド時にまとめて読み込む
const modules = import.meta.glob<{ default: Question[] }>("./questions/*.json", { eager: true });

export const QUESTIONS: Question[] = Object.keys(modules)
  .sort()
  .flatMap((k) => modules[k].default);

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string) {
  return BY_ID.get(id);
}

export function questionsOf(section: SectionId) {
  return QUESTIONS.filter((q) => q.section === section);
}

/** 分野の表示順（本試験の出題順） */
export const FIELD_ORDER: FieldId[] = ["strategy", "management", "technology", "algorithm", "security"];

/** 区分 → 分野 → 中分類 の件数ツリー（分野は FIELD_ORDER の順） */
export function subfieldsOf(section: SectionId) {
  const map = new Map<string, Map<string, number>>();
  const qs = questionsOf(section).slice().sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field));
  for (const q of qs) {
    if (!map.has(q.field)) map.set(q.field, new Map());
    const m = map.get(q.field)!;
    m.set(q.subfield, (m.get(q.subfield) ?? 0) + 1);
  }
  return map;
}

export { EXAMS, FIELD_LABEL, SECTION_LABEL, getExam, getSection } from "./exams";
export type * from "./types";
