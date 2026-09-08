/**
 * 轻量 SVG 雷达图：展示 CLI 实测的五个维度（0–100）。
 * 不引入图表依赖，纯 SVG 绘制，SSR 安全。
 */

export interface RadarSeries {
  name: string;
  values: number[];
  color: string;
}

export const RADAR_COLORS = ["#2563eb", "#0ea5e9", "#7c3aed", "#f59e0b", "#10b981"];

export function RadarChart({
  axes,
  series,
  size = 320,
}: {
  axes: string[];
  series: RadarSeries[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 46;
  const n = axes.length;

  const point = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };

  const rings = [25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height={size}
      role="img"
      aria-label={`雷达图：${series.map((s) => s.name).join("、")} 在 ${axes.join("、")} 上的得分`}
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, i) => point(i, ring).join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth={1}
        />
      ))}

      {axes.map((label, i) => {
        const [x, y] = point(i, 100);
        const [lx, ly] = point(i, 122);
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-border" />
            <text
              x={lx}
              y={ly}
              textAnchor={Math.abs(lx - cx) < 4 ? "middle" : lx > cx ? "start" : "end"}
              dominantBaseline="middle"
              className="fill-current text-text-3"
              style={{ fontSize: 11 }}
            >
              {label}
            </text>
          </g>
        );
      })}

      {series.map((s) => (
        <polygon
          key={s.name}
          points={s.values.map((v, i) => point(i, v).join(",")).join(" ")}
          fill={s.color}
          fillOpacity={0.12}
          stroke={s.color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}

      {series.map((s) =>
        s.values.map((v, i) => {
          const [x, y] = point(i, v);
          return <circle key={`${s.name}-${i}`} cx={x} cy={y} r={2.5} fill={s.color} />;
        }),
      )}
    </svg>
  );
}

export function RadarLegend({ series }: { series: RadarSeries[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-text-2">
      {series.map((s) => (
        <span key={s.name} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}
