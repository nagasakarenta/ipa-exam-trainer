import { useEffect, useRef, useState } from "react";

/** OS の「視差効果を減らす」設定。true ならアニメーションを省略する */
export function prefersReducedMotion() {
  try {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** 0 → value へ数字が駆け上がる。requestAnimationFrame で動かし、イージングは easeOutCubic */
export function useCountUp(value: number, durationMs = 900) {
  const reduced = prefersReducedMotion() || typeof requestAnimationFrame === "undefined";
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    const base = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = base + (value - base) * eased;
      setShown(Number.isInteger(value) ? Math.round(v) : Math.round(v * 10) / 10);
      if (t < 1) raf = requestAnimationFrame(tick);
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
