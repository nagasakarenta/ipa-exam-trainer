import { useMemo, useState } from "react";
import { getQuestion, type Question } from "../data";
import { useProgress } from "../state/context";
import { Quiz, type QuizAnswer } from "../components/Quiz";
import { Results } from "../components/Results";
import { isMastered, sortByUrgency, DAY_MS } from "../lib/srs";

export function Review() {
  const { progress, dispatch } = useProgress();
  const [running, setRunning] = useState<Question[] | null>(null);
  const [result, setResult] = useState<{ answers: QuizAnswer[]; elapsed: number } | null>(null);

  const [now] = useState(() => Date.now());
  const cards = useMemo(() => Object.values(progress.cards), [progress.cards]);
  const due = useMemo(() => sortByUrgency(cards, now).map((c) => getQuestion(c.id)).filter((q): q is Question => !!q), [cards, now]);
  const mastered = cards.filter(isMastered).length;
  const learning = cards.length - mastered;
  const upcoming = cards.filter((c) => c.due > now && c.due <= now + 7 * DAY_MS).length;

  if (result) {
    return (
      <div>
        <div className="page-head">
          <h1>復習の結果</h1>
        </div>
        <Results answers={result.answers} elapsedSec={result.elapsed} judge={false} onBack={() => setResult(null)} />
      </div>
    );
  }
  if (running) {
    return (
      <div>
        <div className="page-head">
          <h1>復習</h1>
        </div>
        <Quiz
          questions={running}
          instantFeedback
          shuffleChoices={progress.settings.shuffleChoices}
          onAnswer={(a) => dispatch({ type: "answer", attempt: { q: a.q.id, choice: a.choice, correct: a.correct, at: Date.now(), mode: "review" } })}
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
          <h1>復習</h1>
          <p>一度解いた問題は、間隔反復（正解するほど次に出るまでの間隔が伸びる方式）で復習の日を決めます。間違えた問題は当日中にもう一度出ます。</p>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi">
          <div className="v" style={{ color: due.length ? "var(--ng)" : undefined }}>
            {due.length}
          </div>
          <div className="l">今日復習する問題</div>
        </div>
        <div className="kpi">
          <div className="v">{upcoming}</div>
          <div className="l">7日以内に復習予定</div>
        </div>
        <div className="kpi">
          <div className="v">{learning}</div>
          <div className="l">学習中</div>
        </div>
        <div className="kpi">
          <div className="v">{mastered}</div>
          <div className="l">定着（間隔7日以上）</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: "1rem" }}>
        {due.length === 0 ? (
          <div className="empty">{cards.length === 0 ? "まずドリルか模擬試験で問題を解くと、ここに復習が並びます" : "今日の復習は終わっています"}</div>
        ) : (
          <>
            <div className="row between">
              <div>
                <strong>{due.length} 問</strong>
                <span className="muted small">　期限を過ぎたもの、間違えた回数が多いものから</span>
              </div>
              <div className="row">
                <button onClick={() => setRunning(due.slice(0, 10))} disabled={due.length <= 10}>
                  10問だけ
                </button>
                <button className="primary" onClick={() => setRunning(due)}>
                  復習を始める
                </button>
              </div>
            </div>
            <table style={{ marginTop: "0.75rem" }}>
              <thead>
                <tr>
                  <th>論点</th>
                  <th>中分類</th>
                  <th className="num">忘れた回数</th>
                  <th className="num">間隔</th>
                </tr>
              </thead>
              <tbody>
                {due.slice(0, 30).map((q) => {
                  const c = progress.cards[q.id];
                  return (
                    <tr key={q.id}>
                      <td>{q.topic}</td>
                      <td className="muted">{q.subfield}</td>
                      <td className="num">{c.lapses}</td>
                      <td className="num">{c.interval}日</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {due.length > 30 && <p className="muted small" style={{ marginTop: "0.5rem" }}>ほか {due.length - 30} 問</p>}
          </>
        )}
      </div>
    </div>
  );
}
