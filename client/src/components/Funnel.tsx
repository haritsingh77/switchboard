import type { Job } from "../types";
import "./Funnel.css";

interface FunnelProps {
  jobs: Job[];
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export default function Funnel({ jobs }: FunnelProps) {
  const applications = jobs.length;
  const responses = jobs.filter((j) => j.status !== "applied").length;
  const interviews = jobs.filter((j) => j.status === "interviewing" || j.status === "offer").length;
  const offers = jobs.filter((j) => j.status === "offer").length;

  const stages = [
    { label: "Applications", value: applications },
    { label: "Responses", value: responses },
    { label: "Interviews", value: interviews },
    { label: "Offers", value: offers },
  ];

  const conversions = [pct(responses, applications), pct(interviews, responses), pct(offers, interviews)];

  return (
    <div className="funnel">
      {stages.map((stage, i) => (
        <div className="funnel-segment" key={stage.label}>
          <div className="funnel-stat">
            <span className="funnel-value">{stage.value}</span>
            <span className="funnel-label">{stage.label}</span>
          </div>
          {i < stages.length - 1 && (
            <div className="funnel-arrow">
              <span className="funnel-pct">{conversions[i]}%</span>
              <span className="funnel-chevron">›</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
