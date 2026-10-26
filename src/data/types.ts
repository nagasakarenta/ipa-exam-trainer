/** 試験の種類 */
export type ExamId = "ip" | "fe";
/** 試験の区分（ITパスポートは1区分、基本情報は科目A・科目B） */
export type SectionId = "ip" | "fe-a" | "fe-b";
/** 出題分野 */
export type FieldId = "strategy" | "management" | "technology" | "algorithm" | "security";

export interface Question {
  id: string;
  exam: ExamId;
  section: SectionId;
  field: FieldId;
  /** シラバスの中分類（例：企業と法務） */
  subfield: string;
  /** 論点の短い名前 */
  topic: string;
  text: string;
  /** 表や条件などの補足。等幅で表示する */
  sub?: string;
  /** 擬似言語などのコード */
  code?: string;
  choices: string[];
  /** 正解の添字（0始まり） */
  answer: number;
  explanation: string;
  /** 取り込み元の情報（任意） */
  source?: { set: string; title: string };
}

export interface SectionSpec {
  id: SectionId;
  exam: ExamId;
  name: string;
  /** 本試験の問題数 */
  count: number;
  /** 本試験の試験時間（分） */
  minutes: number;
  /** 本試験の分野別の出題数（合計が count） */
  blueprint: Partial<Record<FieldId, number>>;
  /** 合格基準（1000点満点換算） */
  passScore: number;
  /** 分野ごとの足切り（ITパスポートのみ） */
  fieldFloor?: number;
}

export interface ExamSpec {
  id: ExamId;
  name: string;
  shortName: string;
  description: string;
  sections: SectionSpec[];
}
