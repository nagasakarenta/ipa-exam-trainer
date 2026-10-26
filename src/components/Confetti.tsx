import { useMemo } from "react";
import { prefersReducedMotion } from "../lib/motion";
import { createRng } from "../lib/random";

const COLORS = ["#2458d6", "#1f8f4e", "#e0a84a", "#ff7b7b", "#6f9bff", "#4cc47d"];

/** 合格ライン到達のときに一度だけ舞う紙吹雪。DOM だけで描き、2.6 秒で消える */
export function Confetti({ count = 48 }: { count?: number }) {
  // 種を固定した乱数で配置を決める（描画中に Math.random を呼ばない）
  const pieces = useMemo(() => {
    const rng = createRng(20261026);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rng() * 100,
      delay: rng() * 0.6,
      duration: 1.8 + rng() * 1.2,
      rotate: rng() * 360,
      color: COLORS[i % COLORS.length],
      size: 6 + rng() * 6,
      drift: (rng() - 0.5) * 120,
    }));
  }, [count]);
  if (prefersReducedMotion()) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // 落下中の横ずれと回転は CSS 変数で渡す
            ["--drift" as string]: `${p.drift}px`,
            ["--rot" as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
