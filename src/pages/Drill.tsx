import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EXAMS, FIELD_LABEL, SECTION_LABEL, getSection, questionsOf, subfieldsOf, type FieldId, type Question, type SectionId } from "../data";
import { useProgress } from "../state/context";
import { Quiz, type QuizAnswer } from "../components/Quiz";
import { Results } from "../components/Results";
import { shuffle } from "../lib/random";
import { groupTally, rate } from "../lib/stats";
import { QUESTIONS } from "../data";

type Order = "random" | "weak" | "unseen";
const SIZES = [10, 20, 30, 0] as const;

export function Drill() {
  const [params] = useSearchParams();
  const initialExam = params.get("exam") === "fe" ? "fe" : "ip";
  const { progress, dispatch } = useProgress();

  const [section, setSection] = useState<SectionId>(initialExam === "fe" ? "fe-a" : "ip");
  const [fields, setFields] = useState<Set<FieldId>>(new Set());
  const [subs, setSubs] = useState<Set<string>>(new Set());
  const [size, setSize] = useState<number>(10);
  const [order, setOrder] = useState<Order>("random");
  const [running, setRunning] = useState<Question[] | null>(null);
  const [result, setResult] = useState<{ answers: QuizAnswer[]; elapsed: number } | null>(null);

  const pool = useMemo(() => questionsOf(section), [section]);
  const tree = useMemo(() => subfieldsOf(section), [section]);
  const qmap = useMemo(() => new Map(QUESTIONS.map((q) => [q.id, q])), []);

  // 中分類のチップ。同じ名前が複数の分野にまたがることがあるので、名前でまとめる
  const subChips = useMemo(() => {
    const m = new Map<string, number>();
    for (const [f, subs] of tree) {
      if (fields.size && !fields.has(f as FieldId)) continue;
      for (const [sf, n] of subs) m.set(sf, (m.get(sf) ?? 0) + n);
    }
    return m;
  }, [tree, fields]);

  const filtered = useMemo(
    () => pool.filter((q) => (fields.size === 0 || fields.has(q.field)) && (subs.size === 0 || subs.has(q.subfield))),
    [pool, fields, subs],
  );

  function start(custom?: Question[]) {
    let qs = custom ?? filtered;
    if (!custom) {
      if (order === "weak") {
        const byQ = groupTally(progress.attempts, qmap, (q) => q.id);
        qs = qs.slice().sort((a, b) => {
          const ta = byQ.get(a.id), tb = byQ.get(b.id);
          // 間違えが多いものを先に。未出題は後ろ
          const ra = ta ? rate(ta) : 2, rb = tb ? rate(tb) : 2;
          return ra - rb || Math.random() - 0.5;
        });
      } else if (order === "unseen") {
        const seen = new Set(progress.attempts.map((a) => a.q));
        const unseen = qs.filter((q) => !seen.has(q.id));
        qs = shuffle(unseen).concat(shuffle(qs.filter((q) => seen.has(q.id))));
      } else {
        qs = shuffle(qs);
      }
      if (size > 0) qs = qs.slice(0, size);
    }
    setResult(null);
    setRunning(qs);
  }

  function changeSection(s: SectionId) {
    setSection(s);
    setFields(new Set());
    setSubs(new Set());
  }

  if (result) {
    return (
      <div>
        <div className="page-head">
          <h1>ドリルの結果</h1>
        </div>
        <Results
          answers={result.answers}
          spec={getSection(section)}
          elapsedSec={result.elapsed}
          judge={false}
          onBack={() => setResult(null)}
          onRetryWrong={() => start(result.answers.filter((a) => !a.correct).map((a) => a.q))}
        />
      </div>
    );
  }

  if (running) {
    return (
      <div>
        <div className="page-head">
          <h1>分野別ドリル　<span className="muted" style={{ fontSize: "1rem" }}>{SECTION_LABEL[section]}</span></h1>
        </div>
        <Quiz
          questions={running}
          instantFeedback
          shuffleChoices={progress.settings.shuffleChoices}
          onAnswer={(a) => dispatch({ type: "answer", attempt: { q: a.q.id, choice: a.choice, correct: a.correct, at: Date.now(), mode: "drill" } })}
          onFinish={(answers, elapsed) => {
            setRunning(null);
            setResult({ answers, elapsed });
          }}
          onAbort={() => setRunning(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>分野別ドリル</h1>
          <p>分野や中分類を絞って解きます。1問ごとに正誤と解説が出ます。</p>
        </div>
      </div>

      <div className="tabs">
        {EXAMS.flatMap((e) => e.sections).map((s) => (
          <button key={s.id} className={s.id === section ? "active" : ""} onClick={() => changeSection(s.id)}>
            {s.exam === "fe" ? `基本情報 ${s.name}` : s.name}
          </button>
        ))}
      </div>

      <div className="card reveal" style={{ ["--i" as string]: 1 }}>
        <h3>分野</h3>
        <div className="chips">
          {[...tree.entries()].map(([f, m]) => {
            const n = [...m.values()].reduce((a, b) => a + b, 0);
            const on = fields.has(f as FieldId);
            return (
              <button
                key={f}
                className={`chip ${on ? "on" : ""}`}
                onClick={() => {
                  const next = new Set(fields);
                  if (on) next.delete(f as FieldId);
                  else next.add(f as FieldId);
                  setFields(next);
                  setSubs(new Set());
                }}
              >
                {FIELD_LABEL[f as FieldId]}
                <span className="n">{n}</span>
              </button>
            );
          })}
        </div>
        <h3 style={{ marginTop: "1rem" }}>中分類</h3>
        <div className="chips">
          {[...subChips.entries()].map(([sf, n]) => {
              const on = subs.has(sf);
              return (
                <button
                  key={sf}
                  className={`chip ${on ? "on" : ""}`}
                  onClick={() => {
                    const next = new Set(subs);
                    if (on) next.delete(sf);
                    else next.add(sf);
                    setSubs(next);
                  }}
                >
                  {sf}
                  <span className="n">{n}</span>
                </button>
              );
            })}
        </div>

        <div className="row" style={{ marginTop: "1.25rem", gap: "1.5rem" }}>
          <label>
            問題数{" "}
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {SIZES.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? `全部（${filtered.length}）` : `${n} 問`}
                </option>
              ))}
            </select>
          </label>
          <label>
            出題順{" "}
            <select value={order} onChange={(e) => setOrder(e.target.value as Order)}>
              <option value="random">ランダム</option>
              <option value="weak">苦手な問題から</option>
              <option value="unseen">まだ解いていない問題から</option>
            </select>
          </label>
        </div>
        <div className="row between" style={{ marginTop: "1rem" }}>
          <span className="muted small">対象 {filtered.length} 問</span>
          <button className="primary" disabled={filtered.length === 0} onClick={() => start()}>
            開始
          </button>
        </div>
      </div>
    </div>
  );
}
