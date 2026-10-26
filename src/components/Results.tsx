import type { QuizAnswer } from "./Quiz";
import type { SectionSpec } from "../data/types";
import { FIELD_LABEL } from "../data/exams";
import { formatDuration, score } from "../lib/scoring";
import { QuestionBody } from "./QuestionBody";
import { CHOICE_KEYS } from "./choiceKeys";
import { ScoreRing } from "./ScoreRing";
import { Confetti } from "./Confetti";
import { useCountUp } from "../lib/motion";

interface Props {
  answers: QuizAnswer[];
  spec?: SectionSpec;
  elapsedSec: number;
  /** 模試なら合否判定を見せる */
  judge: boolean;
  onRetryWrong?: () => void;
  onBack: () => void;
}

export function Results({ answers, spec, elapsedSec, judge, onRetryWrong, onBack }: Props) {
  const s = score(
    answers.map((a) => ({ field: a.q.field, correct: a.correct })),
    spec ?? { passScore: 600 },
  );
  const wrong = answers.filter((a) => !a.correct);
  const tone = s.rate >= 0.6 ? "ok" : s.rate >= 0.4 ? "warn" : "ng";
  const correctShown = useCountUp(s.correct);
  return (
    <div>
      {judge && s.passed && <Confetti />}
      <div className="card">
        <div className="result-hero">
          <ScoreRing rate={s.rate} value={Math.round(s.rate * 100)} label="正答率 %" tone={tone} />
          <div>
            <div className="score">
              {correctShown}
              <small> / {s.total} 問</small>
            </div>
            <div className="muted small">所要 {formatDuration(elapsedSec)}</div>
          </div>
          {judge && (
            <div>
              <div className={s.passed ? "verdict-pass" : "verdict-fail"}>{s.passed ? "合格ライン到達" : "合格ラインに届かず"}</div>
              <div className="muted small">
                推定 {s.estimated} 点 / 1000 点（正答率からの簡易換算。本試験は IRT 方式）
              </div>
              {s.reasons.map((r) => (
                <div key={r} className="small" style={{ color: "var(--ng)" }}>
                  ・{r.replace(/^(strategy|management|technology|algorithm|security)/, (m) => FIELD_LABEL[m as keyof typeof FIELD_LABEL])}
                </div>
              ))}
            </div>
          )}
        </div>
        <table style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>分野</th>
              <th className="num">正答</th>
              <th className="num">正答率</th>
              <th style={{ width: "40%" }}></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(s.byField).map(([f, t]) => {
              const r = t.total ? t.correct / t.total : 0;
              return (
                <tr key={f}>
                  <td>{FIELD_LABEL[f as keyof typeof FIELD_LABEL]}</td>
                  <td className="num">
                    {t.correct} / {t.total}
                  </td>
                  <td className="num">{Math.round(r * 100)}%</td>
                  <td>
                    <div className={`bar animate ${r >= 0.6 ? "ok" : r >= 0.4 ? "warn" : "ng"}`}>
                      <span style={{ width: `${r * 100}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="row" style={{ marginTop: "1rem" }}>
          <button className="primary" onClick={onBack}>
            もどる
          </button>
          {onRetryWrong && wrong.length > 0 && <button onClick={onRetryWrong}>間違えた {wrong.length} 問をやり直す</button>}
        </div>
      </div>

      <div className="card">
        <h2>解答と解説</h2>
        {answers.map((a, i) => (
          <details key={a.q.id} className="qr" open={!a.correct} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
            <summary>
              <span className={`mark ${a.correct ? "ok" : "ng"}`}>{a.correct ? "○" : "×"}</span>
              <span className="muted">問{i + 1}</span>
              <span>{a.q.topic}</span>
              <span className="muted small">
                　{a.q.subfield}
                {a.choice === -1 ? "・未回答" : ""}
              </span>
            </summary>
            <div className="body">
              <QuestionBody q={a.q} />
              <ul style={{ paddingLeft: "1.2rem", margin: "0 0 0.5rem" }}>
                {a.order.map((ci, pos) => (
                  <li
                    key={ci}
                    style={{
                      color: ci === a.q.answer ? "var(--ok)" : ci === a.choice ? "var(--ng)" : undefined,
                      fontWeight: ci === a.q.answer ? 600 : undefined,
                    }}
                  >
                    {CHOICE_KEYS[pos]}　{a.q.choices[ci]}
                    {ci === a.q.answer ? "　← 正解" : ci === a.choice ? "　← あなたの解答" : ""}
                  </li>
                ))}
              </ul>
              <div className="feedback">
                <div className="ex">{a.q.explanation}</div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
