import "./Heatmap.css";

interface HeatmapProps {
  /** Map of YYYY-MM-DD → minutes studied that day. */
  data: Record<string, number>;
  weeks?: number;
}

const DAY = 24 * 60 * 60 * 1000;

function dayKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function level(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

export default function Heatmap({ data, weeks = 18 }: HeatmapProps) {
  const nowLocal = new Date();
  const today = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate()));
  // Start on the Monday (weeks-1) weeks back so the last column ends this week.
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  const start = new Date(today.getTime() - (daysSinceMonday + (weeks - 1) * 7) * DAY);

  const columns: { key: string; minutes: number; future: boolean; label: string }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { key: string; minutes: number; future: boolean; label: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getTime() + (w * 7 + d) * DAY);
      const key = dayKey(date);
      col.push({
        key,
        minutes: data[key] || 0,
        future: date.getTime() > today.getTime(),
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }),
      });
    }
    columns.push(col);
  }

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(data).filter((m) => m > 0).length;

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {columns.map((col, i) => (
          <div key={i} className="heatmap-col">
            {col.map((cell) => (
              <div
                key={cell.key}
                className={`heatmap-cell heatmap-l${cell.future ? "-future" : level(cell.minutes)}`}
                title={cell.future ? "" : `${cell.label}: ${cell.minutes} min`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-footer">
        <span>
          {activeDays} active days · {Math.round((total / 60) * 10) / 10}h total
        </span>
        <span className="heatmap-legend">
          Less
          <i className="heatmap-cell heatmap-l0" />
          <i className="heatmap-cell heatmap-l1" />
          <i className="heatmap-cell heatmap-l2" />
          <i className="heatmap-cell heatmap-l3" />
          <i className="heatmap-cell heatmap-l4" />
          More
        </span>
      </div>
    </div>
  );
}
