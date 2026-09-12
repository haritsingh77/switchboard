import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import type { DueForRevision, RevisionOutcome } from "../types";
import "./Revise.css";

const REVISION_INTERVALS = [1, 3, 7, 14, 30];

function nextIntervalDays(revisionCount: number, outcome: RevisionOutcome) {
  if (outcome === "forgot") return REVISION_INTERVALS[0];
  const idx = outcome === "knew" ? revisionCount + 1 : revisionCount;
  return REVISION_INTERVALS[Math.min(idx, REVISION_INTERVALS.length - 1)];
}

function relativeDays(value?: string) {
  if (!value) return "never";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

const GRADES: { outcome: RevisionOutcome; label: string; hint: string; cls: string }[] = [
  { outcome: "forgot", label: "Forgot", hint: "reset — review again soon", cls: "grade-forgot" },
  { outcome: "kinda", label: "Kind of", hint: "hold — same interval", cls: "grade-kinda" },
  { outcome: "knew", label: "Knew it", hint: "advance — longer gap", cls: "grade-knew" },
];

function Revise() {
  const [queue, setQueue] = useState<DueForRevision[]>([]);
  const [index, setIndex] = useState(0);
  const [graded, setGraded] = useState(0);
  const [grading, setGrading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const due = await apiFetch("/topics/due");
        setQueue(due as DueForRevision[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load revision queue");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const current = queue[index];

  async function grade(outcome: RevisionOutcome) {
    if (!current || grading) return;
    setGrading(true);
    try {
      await apiFetch(`/topics/${current.topicId}/revise`, {
        method: "PATCH",
        body: JSON.stringify({ outcome }),
      });
      setGraded((g) => g + 1);
      setIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record review");
    } finally {
      setGrading(false);
    }
  }

  if (loading) return <p className="revise-msg">Loading revision queue...</p>;
  if (error) return <p className="revise-msg">{error}</p>;

  const done = index >= queue.length;

  return (
    <div className="revise">
      <div className="revise-head">
        <div>
          <h1>Revise</h1>
          <p className="revise-subtitle">Spaced repetition — grade each topic honestly to tune its schedule.</p>
        </div>
        {queue.length > 0 && (
          <span className="revise-progress">
            {Math.min(index, queue.length)} / {queue.length}
          </span>
        )}
      </div>

      {queue.length > 0 && (
        <div className="revise-bar">
          <div className="revise-bar-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
      )}

      {done ? (
        <div className="revise-done">
          <div className="revise-done-check">✓</div>
          <h2>{queue.length === 0 ? "Nothing due" : "Queue cleared"}</h2>
          <p>
            {queue.length === 0
              ? "You're all caught up on spaced repetition."
              : `You reviewed ${graded} topic${graded === 1 ? "" : "s"}. Nice work.`}
          </p>
          <Link to="/" className="revise-done-link">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="revise-card">
          <span className="revise-overdue">
            {current.daysOverdue && current.daysOverdue > 0 ? `${current.daysOverdue}d overdue` : "due today"}
          </span>
          <h2 className="revise-topic">{current.name}</h2>
          <p className="revise-meta">
            Last studied {relativeDays(current.lastStudiedAt)} · Revised {current.revisionCount}× ·{" "}
            <Link to={`/topics/${current.topicId}`} className="revise-view">
              view history
            </Link>
          </p>

          <div className="revise-prompt">How well did you recall this?</div>
          <div className="grade-row">
            {GRADES.map((g) => (
              <button
                key={g.outcome}
                className={`grade-btn ${g.cls}`}
                disabled={grading}
                onClick={() => grade(g.outcome)}
              >
                <span className="grade-label">{g.label}</span>
                <span className="grade-hint">{g.hint}</span>
                <span className="grade-next">next in ~{nextIntervalDays(current.revisionCount, g.outcome)}d</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Revise;
