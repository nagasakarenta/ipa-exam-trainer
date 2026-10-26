import { describe, expect, it } from "vitest";
import { countUpValue } from "./motion";

describe("countUpValue", () => {
  it("経過時間が負でも 0 未満にならず、開始値から動かない", () => {
    expect(countUpValue(0, 1, -28_000, 900)).toBe(0);
    expect(countUpValue(0, 120, -1, 900)).toBe(0);
  });

  it("経過時間が長さを超えたら目標値で止まる", () => {
    expect(countUpValue(0, 1, 900, 900)).toBe(1);
    expect(countUpValue(0, 1, 5_000, 900)).toBe(1);
    expect(countUpValue(3, 7, 10_000, 900)).toBe(7);
  });

  it("途中は単調に増え、小数の目標値は小数 1 桁で返す", () => {
    const a = countUpValue(0, 100, 150, 900);
    const b = countUpValue(0, 100, 450, 900);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(b).toBeLessThan(100);
    expect(countUpValue(0, 4.7, 900, 900)).toBe(4.7);
  });
});
