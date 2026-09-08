/**
 * 轻量 SVG 雷达图：展示 CLI 实测的五个维度（0–100）。
 * 不引入图表依赖，纯 SVG 绘制，SSR 安全。
 * 可选：在每条轴上拖拽调整该维度的权重（weights + onWeightsChange）。
 */

import { useRef } from "react";

export interface RadarSeries {
  name: string;
  values: number[];
  color: string;
}

export const RADAR_COLORS = ["#2563eb", "#0ea5e9", "#7c3aed", "#f59e0b", "#10b981"];

/** 单个维度权重的可拖拽上限（归一化前） */
export const MAX_AXIS_WEIGHT = 0.6;
const MIN_AXIS_WEIGHT = 0.02;

export function RadarChart({
  axes,
  series,
  size = 320,
  weights,
  onWeightsChange,
}: {
  axes: string[];
  series: RadarSeries[];
  size?: number;
  /** 归一化权重（合计 1），传入后显示可拖拽权重环 */
  weights?: number[];
  onWeightsChange?: (next: number[]) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 46;
  const n = axes.length;
  const editable = !!weights && !!onWeightsChange && weights.length === n;

  const point = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };

  /** 权重 → 轴上位置（以 MAX_AXIS_WEIGHT 为满格） */
  const weightPoint = (i: number, w: number) =>
    point(i, Math.min(1, w / MAX_AXIS_WEIGHT) * 100);

  const setWeightFromEvent = (i: number, clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg || !weights || !onWeightsChange) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = ((clientX - rect.left) / rect.width) * size;
    const py = ((clientY - rect.top) / rect.height) * size;
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const t = ((px - cx) * Math.cos(angle) + (py - cy) * Math.sin(angle)) / radius;
    const raw = Math.max(MIN_AXIS_WEIGHT, Math.min(1, t) * MAX_AXIS_WEIGHT);
    const next = weights.slice();
    next[i] = raw;
    onWeightsChange(next);
  };

  const onHandleDown = (i: number) => (e: React.PointerEvent<SVGCircleElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setWeightFromEvent(i, e.clientX, e.clientY);
  };
  const onHandleMove = (i: number) => (e: React.PointerEvent<SVGCircleElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      setWeightFromEvent(i, e.clientX, e.clientY);
    }
  };
  const onHandleKey = (i: number) => (e: React.KeyboardEvent<SVGCircleElement>) => {
    if (!weights || !onWeightsChange) return;
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 0.02
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -0.02
          : 0;
    if (!delta) return;
    e.preventDefault();
    const next = weights.slice();
    next[i] = Math.max(MIN_AXIS_WEIGHT, Math.min(MAX_AXIS_WEIGHT, (weights[i] ?? 0) + delta));
    onWeightsChange(next);
  };

  const rings = [25, 50, 75, 100];



  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height={size}
      style={{ touchAction: "none" }}
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
        const anchor = Math.abs(lx - cx) < 4 ? "middle" : lx > cx ? "start" : "end";
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-border" />
            <text
              x={lx}
              y={editable ? ly - 6 : ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-current text-text-3"
              style={{ fontSize: 11 }}
            >
              {label}
            </text>
            {editable ? (
              <text
                x={lx}
                y={ly + 7}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-current text-brand"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {Math.round((weights![i] ?? 0) * 100)}%
              </text>
            ) : null}
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
          pointerEvents="none"
        />
      ))}

      {series.map((s) =>
        s.values.map((v, i) => {
          const [x, y] = point(i, v);
          return (
            <circle
              key={`${s.name}-${i}`}
              cx={x}
              cy={y}
              r={2.5}
              fill={s.color}
              pointerEvents="none"
            />
          );
        }),
      )}

      {editable ? (
        <>
          <polygon
            points={axes.map((_, i) => weightPoint(i, weights![i] ?? 0).join(",")).join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-brand"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.7}
            pointerEvents="none"
          />
          {axes.map((label, i) => {
            const [hx, hy] = weightPoint(i, weights![i] ?? 0);
            return (
              <circle
                key={`w-${label}`}
                cx={hx}
                cy={hy}
                r={7}
                className="fill-white stroke-brand"
                strokeWidth={2.5}
                style={{ cursor: "grab" }}
                tabIndex={0}
                role="slider"
                aria-label={`${label} 权重`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round((weights![i] ?? 0) * 100)}
                onPointerDown={onHandleDown(i)}
                onPointerMove={onHandleMove(i)}
                onKeyDown={onHandleKey(i)}
              />
            );
          })}
        </>
      ) : null}

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
