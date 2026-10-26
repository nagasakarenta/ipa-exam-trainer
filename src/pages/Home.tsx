import { Link } from "react-router-dom";
import { EXAMS, QUESTIONS, questionsOf } from "../data";
import { useProgress } from "../state/context";
import { isMastered, sortByUrgency } from "../lib/srs";
import { dailyCounts, streak, tally } from "../lib/stats";
import { SECTION_LABEL } from "../data/exams";
import { useCountUp } from "../lib/motion";

export function Home() {
  const { progress } = useProgress();
  const cards = Object.values(progress.cards);
  const due = sortByUrgency(cards).length;
  const today = dailyCounts(progress.attempts, 1)[0];
  const all = tally(progress.attempts);
  const recentMocks = progress.mocks.slice(-3).reverse();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>ホーム</h1>
          <p>ITパスポート・基本情報技術者試験の合格に向けて、解く → 間違いを復習する → 模試で確かめる、を回します。</p>
        </div>
      </div>

      <div className="kpis">
        <Kpi i={0} value={today.total} label="今日解いた問題" />
        <Kpi i={1} value={streak(progress.attempts)} suffix="日" label="連続学習" />
        <Kpi i={2} value={due} label="復習が必要な問題" color={due ? "var(--ng)" : undefined} />
        <div className="kpi reveal" style={{ ["--i" as string]: 3 }}>
          <div className="v">
            {cards.filter(isMastered).length}
            <span className="muted" style={{ fontSize: "0.9rem" }}>
              {" "}
              / {QUESTIONS.length}
            </span>
          </div>
          <div className="l">定着した問題（間隔7日以上）</div>
        </div>
        <div className="kpi reveal" style={{ ["--i" as string]: 4 }}>
          <div className="v">{all.total ? Math.round((all.correct / all.total) * 100) : "–"}%</div>
          <div className="l">通算正答率（{all.total}問）</div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: "1rem" }}>
        {EXAMS.map((exam, i) => (
          <div className="card reveal" key={exam.id} style={{ ["--i" as string]: 5 + i }}>
            <h2>{exam.name}</h2>
            <p className="muted small">{exam.description}</p>
            <table>
              <tbody>
                {exam.sections.map((s) => {
                  const qs = questionsOf(s.id);
                  const t = tally(progress.attempts.filter((a) => qs.some((q) => q.id === a.q)));
                  return (
                    <tr key={s.id}>
                      <td>{SECTION_LABEL[s.id]}</td>
                      <td className="num">{qs.length} 問収録</td>
                      <td className="num">{t.total ? `正答率 ${Math.round((t.correct / t.total) * 100)}%` : "未学習"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="row" style={{ marginTop: "0.75rem" }}>
              <Link to={`/drill?exam=${exam.id}`}>
                <button className="primary">ドリルを始める</button>
              </Link>
              <Link to={`/mock?exam=${exam.id}`}>
                <button>模擬試験</button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="card reveal" style={{ marginTop: "1rem", ["--i" as string]: 7 }}>
        <div className="row between">
          <h2>最近の模擬試験</h2>
          <Link to="/stats">学習記録を見る →</Link>
        </div>
        {recentMocks.length === 0 ? (
          <div className="empty">まだ模擬試験を受けていません</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>日時</th>
                <th>区分</th>
                <th className="num">正答</th>
                <th className="num">推定点</th>
                <th>判定</th>
              </tr>
            </thead>
            <tbody>
              {recentMocks.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{SECTION_LABEL[m.section]}</td>
                  <td className="num">
                    {m.correct} / {m.size}
                  </td>
                  <td className="num">{m.estimated}</td>
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

function Kpi({ i, value, label, suffix = "", color }: { i: number; value: number; label: string; suffix?: string; color?: string }) {
  const shown = useCountUp(value);
  return (
    <div className="kpi reveal" style={{ ["--i" as string]: i }}>
      <div className="v" style={{ color }}>
        {shown}
        {suffix}
      </div>
      <div className="l">{label}</div>
    </div>
  );
}
