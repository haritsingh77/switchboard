import { useMemo } from "react";
import type { FullMock, MiniCheck, FullMockScores } from "../../types";

interface ScoreTrendProps {
  fullMocks: FullMock[];
  miniChecks: MiniCheck[];
}

const W = 640;
const H = 240;
const PAD_L = 34;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 26;

function avg(scores: FullMockScores) {
  return (scores.dsa + scores.concepts + scores.complexity + scores.architecture) / 4;
}

function miniScore(check: MiniCheck) {
  const items = check.items || [];
  if (items.length === 0) return 0;
  return (items.filter((i) => i.correct).length / items.length) * 100;
}

interface Pt {
  t: number;
  y: number;
}

export default function ScoreTrend({ fullMocks, miniChecks }: ScoreTrendProps) {
  const { fullPts, miniPts, isEmpty } = useMemo(() => {
    const full = fullMocks
      .map((m) => ({ t: new Date(m.date).getTime(), y: avg(m.scores) }))
      .sort((a, b) => a.t - b.t);
    const mini = miniChecks
      .map((m) => ({ t: new Date(m.date).getTime(), y: miniScore(m) }))
      .sort((a, b) => a.t - b.t);

    const allT = [...full, ...mini].map((p) => p.t);
    const minT = Math.min(...allT);
    const maxT = Math.max(...allT);
    const span = maxT - minT || 1;

    const px = (t: number) => (allT.length <= 1 ? (PAD_L + (W - PAD_R)) / 2 : PAD_L + ((t - minT) / span) * (W - PAD_L - PAD_R));
    const py = (y: number) => PAD_T + (1 - y / 100) * (H - PAD_T - PAD_B);

    const project = (pts: Pt[]) => pts.map((p) => ({ x: px(p.t), y: py(p.y), v: p.y }));

    return { fullPts: project(full), miniPts: project(mini), isEmpty: allT.length === 0 };
  }, [fullMocks, miniChecks]);

  if (isEmpty) {
    return <p className="mocks-empty">No results yet — record a mock or mini-check to see the trend.</p>;
  }

  const gridY = [0, 25, 50, 75, 100];
  const yToPx = (y: number) => PAD_T + (1 - y / 100) * (H - PAD_T - PAD_B);

  // Moving average (window 3) over full mocks — smooths the trend line.
  const maWindow = 3;
  const maPath =
    fullPts.length > 1
      ? fullPts
          .map((p, i) => {
            const from = Math.max(0, i - maWindow + 1);
            const slice = fullPts.slice(from, i + 1);
            const avg = slice.reduce((s, q) => s + q.v, 0) / slice.length;
            return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${yToPx(avg).toFixed(1)}`;
          })
          .join(" ")
      : "";

  return (
    <div className="score-trend">
      <svg viewBox={`0 0 ${W} ${H}`} className="score-trend-svg" role="img" aria-label="Mock score trend">
        {gridY.map((g) => (
          <g key={g}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yToPx(g)} y2={yToPx(g)} stroke="#2a2438" strokeWidth="1" />
            <text x={PAD_L - 6} y={yToPx(g) + 3} textAnchor="end" className="score-trend-axis">
              {g}
            </text>
          </g>
        ))}

        {maPath && <path d={maPath} fill="none" stroke="#6b6480" strokeWidth="1.5" strokeDasharray="4 4" />}

        {/* Line drawn per-segment so declines (regressions) render red */}
        {fullPts.slice(1).map((p, i) => {
          const prev = fullPts[i];
          const decline = p.v < prev.v;
          return (
            <line
              key={`seg-${i}`}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke={decline ? "#f87171" : "#7c3aed"}
              strokeWidth="2.5"
            />
          );
        })}

        {miniPts.map((p, i) => (
          <circle key={`mini-${i}`} cx={p.x} cy={p.y} r="4" fill="#fbbf24" />
        ))}

        {fullPts.map((p, i) => {
          const decline = i > 0 && p.v < fullPts[i - 1].v;
          return (
            <g key={`full-${i}`}>
              <circle cx={p.x} cy={p.y} r="5" fill={decline ? "#f87171" : "#7c3aed"} stroke="#16131f" strokeWidth="2" />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className={`score-trend-value${decline ? " decline" : ""}`}
              >
                {Math.round(p.v)}
                {decline ? " ↓" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
