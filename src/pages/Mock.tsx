import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EXAMS, FIELD_LABEL, SECTION_LABEL, getSection, questionsOf, type Question, type SectionId } from "../data";
import { useProgress } from "../state/context";
import { Quiz, type QuizAnswer } from "../components/Quiz";
import { Results } from "../components/Results";
import { buildMockSet, timeLimitFor } from "../lib/mock";
import { score } from "../lib/scoring";

export function Mock() {
  const [params] = useSearchParams();
  const { progress, dispatch } = useProgress();
  const [section, setSection] = useState<SectionId>(params.get("exam") === "fe" ? "fe-a" : "ip");
  const [sizeKey, setSizeKey] = useState<"full" | "half" | "quick">("half");
  const [running, setRunning] = useState<{ qs: Question[]; limit: number } | null>(null);
  const [result, setResult] = useState<{ answers: QuizAnswer[]; elapsed: number } | null>(null);

  const spec = getSection(section)!;
  const pool = useMemo(() => questionsOf(section), [section]);
  const sizes = {
    full: { label: `本番と同じ（${spec.count}問・${spec.minutes}分）`, n: spec.count },
    half: { label: `ハーフ（${Math.ceil(spec.count / 2)}問・${Math.round(spec.minutes / 2)}分）`, n: Math.ceil(spec.count / 2) },
    quick: { label: `クイック（10問・${timeLimitFor(spec, 10) / 60 | 0}分）`, n: 10 },
  };
  const requested = sizes[sizeKey].n;
  const actual = Math.min(requested, pool.length);

  function start() {
    const qs = buildMockSet(pool, spec, requested);
    setResult(null);
    setRunning({ qs, limit: timeLimitFor(spec, qs.length) });
  }

  function finish(answers: QuizAnswer[], elapsed: number) {
    // eslint-disable-next-line react/purity -- イベントハンドラ内（render 中ではない）
    const at = Date.now();
    dispatch({
      type: "answers",
      attempts: answers.map((a) => ({ q: a.q.id, choice: a.choice, correct: a.correct, at, mode: "mock" })),
    });
    const s = score(answers.map((a) => ({ field: a.q.field, correct: a.correct })), spec);
    dispatch({
      type: "mock",
      result: {
        id: `${at}`,
        exam: spec.exam,
        section,
        at,
        durationSec: elapsed,
        size: answers.length,
        correct: s.correct,
        estimated: s.estimated,
        passed: s.passed,
        byField: Object.fromEntries(Object.entries(s.byField).map(([f, t]) => [f, { correct: t.correct, total: t.total }])),
      },
    });
    setRunning(null);
    setResult({ answers, elapsed });
  }

  if (result) {
    return (
      <div>
        <div className="page-head">
          <h1>模擬試験の結果　<span className="muted" style={{ fontSize: "1rem" }}>{SECTION_LABEL[section]}</span></h1>
        </div>
        <Results answers={result.answers} spec={spec} elapsedSec={result.elapsed} judge onBack={() => setResult(null)} />
      </div>
    );
  }

  if (running) {
    return (
      <div>
        <div className="page-head">
          <h1>模擬試験　<span className="muted" style={{ fontSize: "1rem" }}>{SECTION_LABEL[section]}</span></h1>
        </div>
        <Quiz
          questions={running.qs}
          instantFeedback={false}
          timeLimitSec={running.limit}
          shuffleChoices={progress.settings.shuffleChoices}
          onFinish={finish}
          onAbort={() => setRunning(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>模擬試験</h1>
          <p>本試験と同じ分野比率・同じペースの制限時間で解き、1000点満点の目安と合否ラインを確かめます。</p>
        </div>
      </div>
      <div className="tabs">
        {EXAMS.flatMap((e) => e.sections).map((s) => (
          <button key={s.id} className={s.id === section ? "active" : ""} onClick={() => setSection(s.id)}>
            {s.exam === "fe" ? `基本情報 ${s.name}` : s.name}
          </button>
        ))}
      </div>
      <div className="card reveal" style={{ ["--i" as string]: 1 }}>
        <h3>本試験の形式</h3>
        <p className="small">
          {spec.count}問・{spec.minutes}分。分野比率は
          {Object.entries(spec.blueprint).map(([f, n]) => (
            <span key={f}>
              {" "}
              {FIELD_LABEL[f as keyof typeof FIELD_LABEL]} {n}問
            </span>
          ))}
          。合格基準は {spec.passScore} 点以上
          {spec.fieldFloor ? `（かつ各分野 ${spec.fieldFloor} 点以上）` : ""}。
        </p>
        <h3 style={{ marginTop: "1rem" }}>問題数</h3>
        <div className="chips">
          {(Object.keys(sizes) as (keyof typeof sizes)[])
            .filter((k, i, arr) => arr.findIndex((o) => sizes[o].n === sizes[k].n) === i)
            .map((k) => (
            <button key={k} className={`chip ${sizeKey === k ? "on" : ""}`} onClick={() => setSizeKey(k)}>
              {sizes[k].label}
            </button>
          ))}
        </div>
        {actual < requested && (
          <p className="small" style={{ color: "var(--warn)", marginTop: "0.75rem" }}>
            収録問題が {pool.length} 問のため、{actual} 問・{Math.round(timeLimitFor(spec, actual) / 60)} 分で実施します。
          </p>
        )}
        <div className="row between" style={{ marginTop: "1rem" }}>
          <span className="muted small">途中で解答を変えられます。時間切れになると自動で採点します。</span>
          <button className="primary" onClick={start} disabled={pool.length === 0}>
            開始
          </button>
        </div>
      </div>
    </div>
  );
}
