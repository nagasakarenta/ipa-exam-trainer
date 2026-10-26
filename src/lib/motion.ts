import { useEffect, useRef, useState } from "react";

/** OS の「視差効果を減らす」設定。true ならアニメーションを省略する */
export function prefersReducedMotion() {
  try {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** カウントアップの途中経過。進捗 t は必ず 0〜1 に収める（負の経過時間でも破綻しない） */
export function countUpValue(base: number, value: number, elapsedMs: number, durationMs: number) {
  const t = durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsedMs / durationMs));
  const eased = 1 - Math.pow(1 - t, 3);
  const v = base + (value - base) * eased;
  return Number.isInteger(value) ? Math.round(v) : Math.round(v * 10) / 10;
}

/** 0 → value へ数字が駆け上がる。requestAnimationFrame で動かし、イージングは easeOutCubic */
export function useCountUp(value: number, durationMs = 900) {
  const reduced = prefersReducedMotion() || typeof requestAnimationFrame === "undefined";
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) return;
    const base = from.current;
    // 開始時刻は最初のフレームのタイムスタンプで取る。performance.now() と rAF の時刻は
    // iframe 内やタブが非表示のときに大きくずれることがあり、経過時間が負になると
    // 「-34480」のような桁外れの値が表示されてしまう。
    let start: number | null = null;
    let raf = 0;
    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      setShown(countUpValue(base, value, elapsed, durationMs));
      if (elapsed < durationMs) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, reduced]);
  return reduced ? value : shown;
}

/** マウント後に true になる。CSS の transition を「初期値 → 目標値」で走らせるために使う */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return mounted;
}
