import { useCountUp, useMounted } from "../lib/motion";

interface Props {
  /** 0〜1 */
  rate: number;
  /** 中央に出す数字 */
  value: number;
  label: string;
  tone: "ok" | "warn" | "ng";
  size?: number;
}

/** 正答率のリング。stroke-dashoffset を transition で動かし、中央の数字はカウントアップする */
export function ScoreRing({ rate, value, label, tone, size = 132 }: Props) {
  const mounted = useMounted();
  const shown = useCountUp(value);
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - (mounted ? rate : 0));
  return (
    <div className={`ring ring-${tone}`} style={{ width: size, height: size }} role="img" aria-label={`${label} ${value}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">
        <div className="ring-num">{shown}</div>
        <div className="ring-label">{label}</div>
      </div>
    </div>
  );
}
