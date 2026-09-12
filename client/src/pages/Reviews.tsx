import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import type { Review, Session, Job } from "../types";
import Modal from "../components/Modal";
import "./Reviews.css";

const DAY = 24 * 60 * 60 * 1000;

function mondayOf(value: Date) {
  const d = new Date(value);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

function relativeTime(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

function sessionsTotal(review: Review) {
  const c = review.stats?.sessionsCompleted;
  if (!c) return 0;
  return (c.dsa || 0) + (c.build || 0) + (c.other || 0);
}

function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Review | null>(null);

  async function load() {
    try {
      const data = await apiFetch("/reviews");
      setReviews(data as Review[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="reviews">
      <div className="reviews-header">
        <div>
          <h1>Weekly Reviews</h1>
          <p className="reviews-subtitle">Anchored to data, not just notes</p>
        </div>
        <button className="reviews-new-btn" onClick={() => setShowNew(true)}>
          + New Review
        </button>
      </div>

      {loading && <p className="reviews-msg">Loading reviews...</p>}
      {error && !loading && <p className="reviews-msg">{error}</p>}

      {!loading && !error && reviews.length === 0 && (
        <p className="reviews-empty">No reviews yet. Write your first weekly review to anchor progress to data.</p>
      )}

      <div className="reviews-list">
        {reviews.map((review) => (
          <article
            key={review._id}
            className="review-card"
            role="button"
            tabIndex={0}
            onClick={() => setSelected(review)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSelected(review);
            }}
          >
            <div className="review-card-head">
              <h2 className="review-week">
                Week of {formatDate(review.weekStart)} – {formatDate(review.weekEnd)}
              </h2>
              <span className="review-ago">{relativeTime(review.createdAt)}</span>
            </div>
            {review.body && <p className="review-body">{review.body}</p>}
            <div className="review-stats">
              <span>
                <strong>{sessionsTotal(review)}</strong> Sessions
              </span>
              <span>
                <strong>{review.stats?.topicsCovered?.length ?? 0}</strong> Topics
              </span>
              <span>
                <strong>{review.stats?.applicationsSent ?? 0}</strong> Applications
              </span>
              {review.stats?.minutesStudied != null && (
                <span>
                  <strong>{Math.round((review.stats.minutesStudied / 60) * 10) / 10}</strong> Hours
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected ? `Week of ${formatDate(selected.weekStart)} – ${formatDate(selected.weekEnd)}` : "Review"
        }
        size="lg"
      >
        {selected && (
          <div className="review-detail">
            <div className="review-detail-stats">
              <span>
                <strong>{sessionsTotal(selected)}</strong> Sessions
              </span>
              <span>
                <strong>{selected.stats?.topicsCovered?.length ?? 0}</strong> Topics
              </span>
              <span>
                <strong>{selected.stats?.applicationsSent ?? 0}</strong> Applications
              </span>
              {selected.stats?.minutesStudied != null && (
                <span>
                  <strong>{Math.round((selected.stats.minutesStudied / 60) * 10) / 10}</strong> Hours
                </span>
              )}
            </div>
            {selected.body && <p className="review-detail-body">{selected.body}</p>}
            {selected.stats?.topicsCovered && selected.stats.topicsCovered.length > 0 && (
              <div className="review-detail-topics">
                <span className="review-detail-label">Topics covered</span>
                <div className="review-detail-chips">
                  {selected.stats.topicsCovered.map((t) => (
                    <span key={t} className="review-chip">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Weekly Review">
        <NewReviewForm
          onDone={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
}

interface AutoStats {
  weekStart: Date;
  weekEnd: Date;
  sessionsCompleted: { dsa: number; build: number; other: number };
  minutesStudied: number;
  topicsCovered: string[];
  applicationsSent: number;
}

function NewReviewForm({ onDone, onSaved }: { onDone: () => void; onSaved: () => void }) {
  const [auto, setAuto] = useState<AutoStats | null>(null);
  const [body, setBody] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function collect() {
      const weekStart = mondayOf(new Date());
      const weekEnd = new Date(weekStart.getTime() + 6 * DAY);
      try {
        const [sessions, jobs] = await Promise.all([
          apiFetch(`/sessions?weekStart=${weekStart.toISOString()}`),
          apiFetch("/jobs"),
        ]);
        const completed = (sessions as Session[]).filter((s) => s.status === "completed");
        const sessionsCompleted = { dsa: 0, build: 0, other: 0 };
        const topics = new Set<string>();
        let minutes = 0;
        for (const s of completed) {
          sessionsCompleted[s.track] += 1;
          minutes += s.minutesSpent || 0;
          for (const t of s.topics || []) if (t.name) topics.add(t.name);
        }
        const weekEndFull = new Date(weekStart.getTime() + 7 * DAY);
        const applicationsSent = (jobs as Job[]).filter((j) => {
          const d = j.appliedDate ? new Date(j.appliedDate) : null;
          return d && d >= weekStart && d < weekEndFull;
        }).length;

        setAuto({
          weekStart,
          weekEnd,
          sessionsCompleted,
          minutesStudied: minutes,
          topicsCovered: [...topics],
          applicationsSent,
        });
      } catch (error) {
        setErr(error instanceof Error ? error.message : "Failed to collect stats");
      } finally {
        setLoadingStats(false);
      }
    }
    collect();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!auto) return;
    setSaving(true);
    setErr("");
    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          weekStart: auto.weekStart.toISOString(),
          weekEnd: auto.weekEnd.toISOString(),
          body,
          stats: {
            sessionsCompleted: auto.sessionsCompleted,
            minutesStudied: auto.minutesStudied,
            topicsCovered: auto.topicsCovered,
            applicationsSent: auto.applicationsSent,
          },
        }),
      });
      onSaved();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  const totalSessions = auto
    ? auto.sessionsCompleted.dsa + auto.sessionsCompleted.build + auto.sessionsCompleted.other
    : 0;

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="review-auto">
        <span className="review-auto-label">Auto-collected stats for this week</span>
        {loadingStats ? (
          <span className="review-auto-loading">Collecting…</span>
        ) : auto ? (
          <div className="review-auto-stats">
            <span>
              <strong>{totalSessions}</strong> Sessions
            </span>
            <span>
              <strong>{auto.topicsCovered.length}</strong> Topics
            </span>
            <span>
              <strong>{auto.applicationsSent}</strong> Applications
            </span>
            <span>
              <strong>{Math.round((auto.minutesStudied / 60) * 10) / 10}</strong> Hours
            </span>
          </div>
        ) : null}
      </div>

      <div className="field">
        <label>Review Notes</label>
        <textarea
          rows={8}
          placeholder="What happened, what improved, what didn't, and what you're consolidating…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {err && <p className="review-error">{err}</p>}

      <div className="review-actions">
        <button type="button" className="review-cancel" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="review-save" disabled={saving || loadingStats}>
          {saving ? "Saving..." : "Save Review"}
        </button>
      </div>
    </form>
  );
}

export default Reviews;
