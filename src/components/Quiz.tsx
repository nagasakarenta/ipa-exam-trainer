import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "../data/types";
import { shuffle } from "../lib/random";
import { formatClock } from "../lib/scoring";
import { QuestionBody, QuestionMeta } from "./QuestionBody";
import { CHOICE_KEYS } from "./choiceKeys";

export interface QuizAnswer {
  q: Question;
  /** 選んだ添字（元の順）。未回答は -1 */
  choice: number;
  correct: boolean;
  /** 出題時の選択肢の表示順（元の添字の並び）。結果画面で同じ順に見せるため */
  order: number[];
}

interface Props {
  questions: Question[];
  /** 解答ごとに正誤と解説を見せる（ドリル・復習）。false なら模試形式 */
  instantFeedback: boolean;
  /** 制限時間（秒）。省略で無制限 */
  timeLimitSec?: number;
  shuffleChoices: boolean;
  /** 1問答えるたびに呼ばれる（ドリル・復習の記録用） */
  onAnswer?: (a: QuizAnswer) => void;
  onFinish: (answers: QuizAnswer[], elapsedSec: number) => void;
  onAbort?: () => void;
}

export function Quiz({ questions, instantFeedback, timeLimitSec, shuffleChoices, onAnswer, onFinish, onAbort }: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const finished = useRef(false);

  // 選択肢の表示順（問題ごとに固定）
  const orders = useMemo(
    () => questions.map((q) => (shuffleChoices ? shuffle(q.choices.map((_, i) => i)) : q.choices.map((_, i) => i))),
    [questions, shuffleChoices],
  );

  const q = questions[index];
  const order = orders[index];
  const answered = picked[index] !== undefined;
  const total = questions.length;
  const doneCount = Object.keys(picked).length;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const answers = questions.map((qq, i) => {
      const c = picked[i] ?? -1;
      return { q: qq, choice: c, correct: c === qq.answer, order: orders[i] };
    });
    onFinish(answers, Math.round((Date.now() - startedAt.current) / 1000));
  }, [questions, picked, orders, onFinish]);

  // タイマー（開始時刻はマウント時に決める）
  useEffect(() => {
    startedAt.current = Date.now();
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (timeLimitSec !== undefined && elapsed >= timeLimitSec) finish();
  }, [elapsed, timeLimitSec, finish]);

  const choose = useCallback(
    (displayPos: number) => {
      if (finished.current) return;
      const original = order[displayPos];
      if (original === undefined) return;
      if (instantFeedback && answered) return;
      setPicked((p) => ({ ...p, [index]: original }));
      if (instantFeedback) onAnswer?.({ q, choice: original, correct: original === q.answer, order });
    },
    [order, instantFeedback, answered, index, q, onAnswer],
  );

  const next = useCallback(() => {
    if (index + 1 < total) setIndex(index + 1);
    else if (instantFeedback) finish();
  }, [index, total, instantFeedback, finish]);

  // キーボード：1〜9 で選ぶ、Enter / → で次へ、← で前へ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (/^[1-9]$/.test(e.key)) choose(Number(e.key) - 1);
      else if (e.key === "Enter" || e.key === "ArrowRight") {
        if (!instantFeedback || answered) next();
      } else if (e.key === "ArrowLeft" && !instantFeedback) setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, next, instantFeedback, answered]);

  const remaining = timeLimitSec !== undefined ? timeLimitSec - elapsed : undefined;
  const isLast = index === total - 1;

  return (
    <div>
      <div className="quiz-head">
        <div className="progress-line" style={{ flex: 1, minWidth: 200 }}>
          <strong>
            {index + 1} / {total}
          </strong>
          <div className="bar">
            <span style={{ width: `${(doneCount / total) * 100}%` }} />
          </div>
        </div>
        <div className="row">
          {remaining !== undefined ? (
            <span className={`clock ${remaining <= 60 ? "low" : ""}`} title="残り時間">
              ⏱ {formatClock(remaining)}
            </span>
          ) : (
            <span className="clock muted" title="経過時間">
              {formatClock(elapsed)}
            </span>
          )}
          {onAbort && (
            <button className="sm" onClick={onAbort}>
              中断
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <QuestionMeta q={q} />
        <QuestionBody q={q} />
        <div className="choices">
          {order.map((orig, pos) => {
            const selected = picked[index] === orig;
            const reveal = instantFeedback && answered;
            const cls = ["choice"];
            if (reveal && orig === q.answer) cls.push("correct");
            else if (reveal && selected) cls.push("wrong");
            else if (selected) cls.push("selected");
            return (
              <button key={orig} className={cls.join(" ")} onClick={() => choose(pos)} disabled={reveal}>
                <span className="k">{CHOICE_KEYS[pos]}</span>
                <span className="t">{q.choices[orig]}</span>
                <span className="muted small">{pos + 1}</span>
              </button>
            );
          })}
        </div>

        {instantFeedback && answered && (
          <div className={`feedback ${picked[index] === q.answer ? "ok" : "ng"}`}>
            <div className="verdict">
              {picked[index] === q.answer ? "正解" : `不正解　正解は「${CHOICE_KEYS[order.indexOf(q.answer)]}」`}
            </div>
            <div className="ex">{q.explanation}</div>
          </div>
        )}

        <div className="row between" style={{ marginTop: "1rem" }}>
          <div className="row">
            {!instantFeedback && (
              <>
                <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
                  ← 前へ
                </button>
                <button
                  onClick={() =>
                    setFlags((f) => {
                      const n = new Set(f);
                      if (n.has(index)) n.delete(index);
                      else n.add(index);
                      return n;
                    })
                  }
                >
                  {flags.has(index) ? "印を外す" : "あとで見る"}
                </button>
              </>
            )}
            <span className="muted small">
              <span className="kbd">1</span>〜<span className="kbd">{Math.min(order.length, 9)}</span> で選択、<span className="kbd">Enter</span> で次へ
            </span>
          </div>
          <div className="row">
            {instantFeedback ? (
              <button className="primary" onClick={next} disabled={!answered}>
                {isLast ? "結果を見る" : "次へ →"}
              </button>
            ) : isLast ? (
              <button className="primary" onClick={finish}>
                採点する{doneCount < total ? `（未回答 ${total - doneCount}）` : ""}
              </button>
            ) : (
              <button className="primary" onClick={next}>
                次へ →
              </button>
            )}
          </div>
        </div>

        {!instantFeedback && (
          <div className="navgrid" aria-label="問題一覧">
            {questions.map((_, i) => (
              <button
                key={i}
                className={[i === index ? "cur" : "", picked[i] !== undefined ? "done" : "", flags.has(i) ? "flag" : ""].join(" ")}
                onClick={() => setIndex(i)}
                title={flags.has(i) ? "あとで見る" : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
