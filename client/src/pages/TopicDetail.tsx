import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api";
import type { Topic, Session, Phase, RevisionOutcome, TopicResource } from "../types";
import "./TopicDetail.css";

const GRADES: { outcome: RevisionOutcome; label: string; cls: string }[] = [
  { outcome: "forgot", label: "Forgot", cls: "grade-forgot" },
  { outcome: "kinda", label: "Kind of", cls: "grade-kinda" },
  { outcome: "knew", label: "Knew it", cls: "grade-knew" },
];

const OUTCOME_LABELS: Record<RevisionOutcome, string> = { knew: "Knew it", kinda: "Kind of", forgot: "Forgot" };

const DAY = 24 * 60 * 60 * 1000;
const REVISION_INTERVALS = [1, 3, 7, 14, 30];
const TRACK_LABELS: Record<Session["track"], string> = { dsa: "DSA", build: "Build", other: "Other" };
const STATUS_LABELS: Record<Topic["status"], string> = {
  unscheduled: "Unscheduled",
  scheduled: "Scheduled",
  completed: "Completed",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function relativeDays(value?: string) {
  if (!value) return "never";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function nextDue(topic: Topic): { label: string; overdue: boolean } | null {
  if (!topic.lastStudiedAt) return null;
  const idx = Math.min(topic.revisionCount, REVISION_INTERVALS.length - 1);
  const dueMs = new Date(topic.lastStudiedAt).getTime() + REVISION_INTERVALS[idx] * DAY;
  const days = Math.round((dueMs - Date.now()) / DAY);
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, overdue: true };
  if (days === 0) return { label: "Due today", overdue: true };
  return { label: `Due in ${days}d`, overdue: false };
}

function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [phaseName, setPhaseName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revising, setRevising] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [t, s] = await Promise.all([apiFetch(`/topics/${id}`), apiFetch(`/topics/${id}/sessions`)]);
      setTopic(t as Topic);
      setSessions(s as Session[]);
      const topicDoc = t as Topic;
      if (topicDoc.phaseId) {
        try {
          const phase = (await apiFetch(`/phases/${topicDoc.phaseId}`)) as Phase;
          setPhaseName(phase.name);
        } catch {
          /* phase name is a nicety; ignore failures */
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load topic");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveResources(resources: TopicResource[]) {
    if (!id) return;
    const updated = (await apiFetch(`/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ resources }),
    })) as Topic;
    setTopic(updated);
  }

  function addResource(label: string, url: string) {
    saveResources([...(topic?.resources || []), { label, url }]);
  }

  function removeResource(i: number) {
    saveResources((topic?.resources || []).filter((_, idx) => idx !== i));
  }

  async function grade(outcome: RevisionOutcome) {
    if (!id || revising) return;
    setRevising(true);
    try {
      const updated = (await apiFetch(`/topics/${id}/revise`, {
        method: "PATCH",
        body: JSON.stringify({ outcome }),
      })) as Topic;
      setTopic(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record review");
    } finally {
      setRevising(false);
    }
  }

  if (loading) return <p className="topic-msg">Loading topic...</p>;
  if (error) return <p className="topic-msg">{error}</p>;
  if (!topic) return null;

  const due = nextDue(topic);

  return (
    <div className="topic-detail">
      <Link to="/roadmap" className="topic-back">
        ← Back to Roadmap
      </Link>

      <div className="topic-head">
        <div className="topic-head-main">
          {phaseName && <span className="topic-phase">{phaseName}</span>}
          <h1>{topic.name}</h1>
          <span className={`topic-status-pill topic-status-${topic.status}`}>{STATUS_LABELS[topic.status]}</span>
        </div>
        <div className="topic-grade">
          <span className="topic-grade-label">Revise:</span>
          {GRADES.map((g) => (
            <button key={g.outcome} className={`topic-grade-btn ${g.cls}`} disabled={revising} onClick={() => grade(g.outcome)}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="topic-stats">
        <div className="topic-stat">
          <span className="topic-stat-value">{Math.round((topic.totalMinutes / 60) * 10) / 10}h</span>
          <span className="topic-stat-label">Total studied</span>
        </div>
        <div className="topic-stat">
          <span className="topic-stat-value">{topic.revisionCount}</span>
          <span className="topic-stat-label">Times revised</span>
        </div>
        <div className="topic-stat">
          <span className="topic-stat-value">{relativeDays(topic.lastStudiedAt)}</span>
          <span className="topic-stat-label">Last studied</span>
        </div>
        <div className={`topic-stat ${due?.overdue ? "topic-stat-warn" : ""}`}>
          <span className="topic-stat-value">{due ? due.label : "—"}</span>
          <span className="topic-stat-label">Spaced repetition</span>
        </div>
      </div>

      <section className="topic-resources">
        <h2>Resources</h2>
        <ResourceForm onAdd={addResource} />
        {(topic.resources || []).length === 0 ? (
          <p className="topic-empty">No resources yet — add LeetCode lists, articles, or your notes.</p>
        ) : (
          <div className="resource-list">
            {(topic.resources || []).map((r, i) => (
              <div key={i} className="resource-row">
                <a href={r.url} target="_blank" rel="noreferrer noopener" className="resource-link">
                  {r.label || r.url}
                </a>
                <button className="resource-del" aria-label="Remove" onClick={() => removeResource(i)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {topic.reviews && topic.reviews.length > 0 && (
        <section className="topic-reviews">
          <h2>Revision History</h2>
          <div className="review-log">
            {[...topic.reviews].reverse().map((r, i) => (
              <span key={i} className={`review-chip review-${r.outcome}`}>
                {formatDate(r.date)} · {OUTCOME_LABELS[r.outcome]}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="topic-history">
        <h2>Session History</h2>
        {sessions.length === 0 ? (
          <p className="topic-empty">This topic hasn't appeared in a study session yet.</p>
        ) : (
          <div className="topic-timeline">
            {sessions.map((s) => {
              const entry = s.topics.find((t) => t.name && topic.name.includes(t.name.split(" ")[0]));
              const mins = entry?.minutesSpent ?? s.topics.reduce((a, t) => a + (t.minutesSpent || 0), 0);
              return (
                <div key={s._id} className={`timeline-row timeline-${s.status}`}>
                  <div className="timeline-marker" />
                  <div className="timeline-body">
                    <div className="timeline-top">
                      <span className="timeline-date">{formatDate(s.date)}</span>
                      <span className="timeline-meta">
                        {s.slot.toUpperCase()} · {TRACK_LABELS[s.track]}
                        {mins ? ` · ${mins} min` : ""}
                      </span>
                    </div>
                    {s.notes && <p className="timeline-notes">{s.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ResourceForm({ onAdd }: { onAdd: (label: string, url: string) => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    onAdd(label.trim(), normalized);
    setLabel("");
    setUrl("");
  }

  return (
    <form className="resource-form" onSubmit={submit}>
      <input type="text" placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input type="text" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
}

export default TopicDetail;
