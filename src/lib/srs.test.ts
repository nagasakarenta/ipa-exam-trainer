import { describe, expect, it } from "vitest";
import { DAY_MS, isDue, isMastered, newCard, review, sortByUrgency } from "./srs";

const T0 = Date.UTC(2026, 0, 1);

describe("srs", () => {
  it("新しいカードはすぐ出す", () => {
    const c = newCard("q1", T0);
    expect(isDue(c, T0)).toBe(true);
    expect(c.interval).toBe(0);
  });

  it("正解すると 1日 → 3日 → 7日 → ease倍 と間隔が伸びる", () => {
    let c = newCard("q1", T0);
    c = review(c, true, T0);
    expect(c.interval).toBe(1);
    expect(c.due).toBe(T0 + DAY_MS);
    c = review(c, true, c.due);
    expect(c.interval).toBe(3);
    c = review(c, true, c.due);
    expect(c.interval).toBe(7);
    const before = c;
    c = review(c, true, c.due);
    expect(c.interval).toBe(Math.round(7 * before.ease));
    expect(c.reps).toBe(4);
    expect(c.lapses).toBe(0);
  });

  it("不正解だと間隔は 0 に戻り、ease が下がり、当日中にもう一度出る", () => {
    let c = newCard("q1", T0);
    c = review(c, true, T0);
    c = review(c, true, c.due);
    const now = c.due;
    c = review(c, false, now);
    expect(c.interval).toBe(0);
    expect(c.ease).toBeCloseTo(2.4); // 2.5 + 0.05×2 − 0.2
    expect(c.lapses).toBe(1);
    expect(isDue(c, now)).toBe(true);
  });

  it("ease には下限と上限がある", () => {
    let c = newCard("q1", T0);
    for (let i = 0; i < 20; i++) c = review(c, false, T0);
    expect(c.ease).toBe(1.3);
    let d = newCard("q2", T0);
    for (let i = 0; i < 40; i++) d = review(d, true, d.due);
    expect(d.ease).toBe(3);
  });

  it("期限切れを、期限の古い順・忘れた回数の多い順に並べる", () => {
    const a = { ...newCard("a", T0), due: T0 - DAY_MS, lapses: 0 };
    const b = { ...newCard("b", T0), due: T0 - DAY_MS, lapses: 3 };
    const c = { ...newCard("c", T0), due: T0 - 2 * DAY_MS };
    const future = { ...newCard("d", T0), due: T0 + DAY_MS };
    expect(sortByUrgency([a, b, c, future], T0).map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("間隔 7 日以上で定着とみなす", () => {
    expect(isMastered({ ...newCard("a"), interval: 7 })).toBe(true);
    expect(isMastered({ ...newCard("a"), interval: 3 })).toBe(false);
  });
});
