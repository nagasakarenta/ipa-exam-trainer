import { describe, expect, it } from "vitest";
import { createRng, sample, shuffle } from "./random";

describe("random", () => {
  it("同じ種なら同じ並びになる", () => {
    const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8], createRng(42));
    const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8], createRng(42));
    expect(a).toEqual(b);
    expect(a.slice().sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("元の配列は変えない", () => {
    const src = [1, 2, 3];
    shuffle(src, createRng(1));
    expect(src).toEqual([1, 2, 3]);
  });

  it("sample は重複なしで n 個、足りなければ全部", () => {
    const s = sample([1, 2, 3, 4, 5], 3, createRng(7));
    expect(s).toHaveLength(3);
    expect(new Set(s).size).toBe(3);
    expect(sample([1, 2], 5, createRng(7))).toHaveLength(2);
    expect(sample([1, 2], -1)).toHaveLength(0);
  });
});
