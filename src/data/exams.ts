import type { ExamSpec, FieldId, SectionId } from "./types";

export const FIELD_LABEL: Record<FieldId, string> = {
  strategy: "ストラテジ系",
  management: "マネジメント系",
  technology: "テクノロジ系",
  algorithm: "アルゴリズムとプログラミング",
  security: "情報セキュリティ",
};

export const SECTION_LABEL: Record<SectionId, string> = {
  ip: "ITパスポート",
  "fe-a": "科目A",
  "fe-b": "科目B",
};

export const EXAMS: ExamSpec[] = [
  {
    id: "ip",
    name: "ITパスポート試験",
    shortName: "ITパスポート",
    description:
      "ITを利活用するすべての社会人・学生が備えておくべき基礎知識を問う国家試験。四肢択一100問・120分。",
    sections: [
      {
        id: "ip",
        exam: "ip",
        name: "ITパスポート",
        count: 100,
        minutes: 120,
        blueprint: { strategy: 35, management: 20, technology: 45 },
        passScore: 600,
        fieldFloor: 300,
      },
    ],
  },
  {
    id: "fe",
    name: "基本情報技術者試験",
    shortName: "基本情報",
    description:
      "ITエンジニアの登竜門。科目A（知識・四肢択一60問・90分）と科目B（アルゴリズムとセキュリティ・20問・100分）の両方で600点以上が必要。",
    sections: [
      {
        id: "fe-a",
        exam: "fe",
        name: "科目A",
        count: 60,
        minutes: 90,
        blueprint: { technology: 41, management: 7, strategy: 12 },
        passScore: 600,
      },
      {
        id: "fe-b",
        exam: "fe",
        name: "科目B",
        count: 20,
        minutes: 100,
        blueprint: { algorithm: 16, security: 4 },
        passScore: 600,
      },
    ],
  },
];

export function getExam(id: string) {
  return EXAMS.find((e) => e.id === id);
}

export function getSection(id: string) {
  for (const exam of EXAMS) {
    const s = exam.sections.find((x) => x.id === id);
    if (s) return s;
  }
  return undefined;
}
