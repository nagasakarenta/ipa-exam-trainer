/**
 * 間隔反復（SM-2 を単純化したもの）。
 *
 * - 正解すると次に出すまでの間隔が伸びる（1日 → 3日 → 7日 → それ以降は ease 倍）
 * - 不正解だと間隔は 0 に戻り、ease が下がる（下限 1.3）
 * - 連続で正解すると ease が少し上がる（上限 3.0）
 */
export interface Card {
  id: string;
  /** 次に出す日時（ms） */
  due: number;
  /** 今の間隔（日） */
  interval: number;
  /** 間隔の伸び率 */
  ease: number;
  /** 復習した回数 */
  reps: number;
  /** 忘れた回数 */
  lapses: number;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

export function newCard(id: string, now = Date.now()): Card {
  return { id, due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 };
}

export function review(card: Card, correct: boolean, now = Date.now()): Card {
  if (!correct) {
    return {
      ...card,
      interval: 0,
      ease: Math.max(MIN_EASE, round(card.ease - 0.2)),
      reps: card.reps + 1,
      lapses: card.lapses + 1,
      // 間違えた問題は同じ日のうちにもう一度出す
      due: now,
    };
  }
  let interval: number;
  if (card.interval === 0) interval = 1;
  else if (card.interval === 1) interval = 3;
  else if (card.interval <= 3) interval = 7;
  else interval = Math.round(card.interval * card.ease);
  return {
    ...card,
    interval,
    ease: Math.min(MAX_EASE, round(card.ease + 0.05)),
    reps: card.reps + 1,
    due: now + interval * DAY_MS,
  };
}

export function isDue(card: Card, now = Date.now()) {
  return card.due <= now;
}

/** 復習の優先順：期限を過ぎているものほど先、同じなら忘れた回数が多いものほど先 */
export function sortByUrgency(cards: Card[], now = Date.now()) {
  return cards
    .filter((c) => isDue(c, now))
    .sort((a, b) => a.due - b.due || b.lapses - a.lapses);
}

/** 「定着した」と見なす目安：間隔が 7 日以上 */
export function isMastered(card: Card) {
  return card.interval >= 7;
}

function round(x: number) {
  return Math.round(x * 100) / 100;
}
