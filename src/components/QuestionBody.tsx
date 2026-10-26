import type { Question } from "../data/types";
import { FIELD_LABEL, SECTION_LABEL } from "../data/exams";

export function QuestionMeta({ q }: { q: Question }) {
  return (
    <div className="q-meta">
      <span className="tag">{SECTION_LABEL[q.section]}</span>
      <span className="tag">{FIELD_LABEL[q.field]}</span>
      {q.subfield !== FIELD_LABEL[q.field] && <span className="tag">{q.subfield}</span>}
      <span className="tag">{q.topic}</span>
    </div>
  );
}

export function QuestionBody({ q }: { q: Question }) {
  return (
    <>
      <div className="q-text">{q.text}</div>
      {q.sub && <pre>{q.sub}</pre>}
      {q.code && <pre>{q.code}</pre>}
    </>
  );
}
