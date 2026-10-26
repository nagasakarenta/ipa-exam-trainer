import { useMemo, useState } from "react";
import { EXAMS, FIELD_LABEL, QUESTIONS, SECTION_LABEL, questionsOf, type SectionId } from "../data";
import { useProgress } from "../state/context";
import { dailyCounts, groupTally, rate, tally, weakest } from "../lib/stats";
import { formatDuration } from "../lib/scoring";

export function Stats() {
  const { progress } = useProgress();
  const [section, setSection] = useState<SectionId>("ip");
  const qmap = useMemo(() => new Map(QUESTIONS.map((q) => [q.id, q])), []);
  const ids = useMemo(() => new Set(questionsOf(section).map((q) => q.id)), [section]);
  const attempts = useMemo(() => progress.attempts.filter((a) => ids.has(a.q)), [progress.attempts, ids]);

  const total = tally(attempts);
  const byField = groupTally(attempts, qmap, (q) => q.field);
  const bySub = groupTally(attempts, qmap, (q) => q.subfield);
  const byTopic = groupTally(attempts, qmap, (q) => q.topic);
  const weak = weakest(byTopic, 2, 10);
  const daily = dailyCounts(progress.attempts, 14);
  const max = Math.max(1, ...daily.map((d) => d.total));
  const coverage = new Set(attempts.map((a) => a.q)).size;
  const mocks = progress.mocks.filter((m) => m.section === section).slice().reverse();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>学習記録</h1>
          <p>分野・中分類・論点ごとの正答率から、弱点を見つけます。</p>
        </div>
      </div>

      <div className="card">
        <h3>直近14日の解答数</h3>
        <div className="daily">
          {daily.map((d) => (
            <div key={d.day} className="d" style={{ height: `${(d.total / max) * 100}%` }} title={`${d.day}：${d.total}問（正解 ${d.correct}）`}>
              <span style={{ height: d.total ? `${(d.correct / d.total) * 100}%` : 0 }} />
            </div>
          ))}
        </div>
        <div className="daily-labels">
          {daily.map((d) => (
            <div key={d.day}>{d.day.slice(5).replace("-", "/")}</div>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: "0.5rem" }}>濃い部分が正解した問題。全区分の合計です。</p>
      </div>

      <div className="tabs" style={{ marginTop: "1rem" }}>
        {EXAMS.flatMap((e) => e.sections).map((s) => (
          <button key={s.id} className={s.id === section ? "active" : ""} onClick={() => setSection(s.id)}>
            {s.exam === "fe" ? `基本情報 ${s.name}` : s.name}
          </button>
        ))}
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="v">{total.total}</div>
          <div className="l">解答数</div>
        </div>
        <div className="kpi">
          <div className="v">{total.total ? Math.round(rate(total) * 100) : "–"}%</div>
          <div className="l">正答率</div>
        </div>
        <div className="kpi">
          <div className="v">
            {coverage}
            <span className="muted" style={{ fontSize: "0.9rem" }}>
              {" "}
              / {ids.size}
            </span>
          </div>
          <div className="l">解いた問題の種類</div>
        </div>
      </div>

      {total.total === 0 ? (
        <div className="empty" style={{ marginTop: "1rem" }}>
          {SECTION_LABEL[section]} はまだ解いていません
        </div>
      ) : (
        <>
          <div className="grid" style={{ marginTop: "1rem" }}>
            <TallyTable title="分野別" rows={[...byField.entries()].map(([k, t]) => [FIELD_LABEL[k as keyof typeof FIELD_LABEL] ?? k, t] as const)} />
            <TallyTable title="中分類別" rows={[...bySub.entries()].sort((a, b) => rate(a[1]) - rate(b[1]))} />
          </div>
          <div className="card" style={{ marginTop: "1rem" }}>
            <h3>苦手な論点（2回以上解いたもの）</h3>
            {weak.length === 0 ? (
              <p className="muted small">同じ論点を2回以上解くと表示されます</p>
            ) : (
              <TallyTable rows={weak} />
            )}
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>模擬試験の履歴</h3>
        {mocks.length === 0 ? (
          <p className="muted small">まだありません</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>日時</th>
                <th className="num">正答</th>
                <th className="num">推定点</th>
                <th className="num">所要</th>
                <th>判定</th>
              </tr>
            </thead>
            <tbody>
              {mocks.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="num">
                    {m.correct} / {m.size}
                  </td>
                  <td className="num">{m.estimated}</td>
                  <td className="num">{formatDuration(m.durationSec)}</td>
                  <td>
                    <span className={`tag ${m.passed ? "ok" : "ng"}`}>{m.passed ? "合格ライン" : "未達"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TallyTable({ title, rows }: { title?: string; rows: (readonly [string, { correct: number; total: number }])[] }) {
  return (
    <div className={title ? "card" : ""}>
      {title && <h3>{title}</h3>}
      <table>
        <thead>
          <tr>
            <th>項目</th>
            <th className="num">正答</th>
            <th className="num">率</th>
            <th style={{ width: "35%" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, t]) => {
            const r = rate(t);
            return (
              <tr key={k}>
                <td>{k}</td>
                <td className="num">
                  {t.correct} / {t.total}
                </td>
                <td className="num">{Math.round(r * 100)}%</td>
                <td>
                  <div className={`bar ${r >= 0.7 ? "ok" : r >= 0.5 ? "warn" : "ng"}`}>
                    <span style={{ width: `${r * 100}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
