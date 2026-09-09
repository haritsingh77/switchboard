import { useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "../api";
import type { Session, Topic, SessionTopic } from "../types";
import Modal from "../components/Modal";
import "./Planner.css";

const DAY = 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TRACK_LABELS: Record<Session["track"], string> = { dsa: "DSA", build: "Build", other: "Other" };
const SLOT_ORDER: Record<Session["slot"], number> = { morning: 0, evening: 1 };

function mondayOf(value: Date) {
  const d = new Date(value);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDay(value: Date) {
  return value.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function sessionTitle(session: Session) {
  const names = session.topics.map((t) => t.name).filter(Boolean);
  if (names.length) return names.join(", ");
  return TRACK_LABELS[session.track];
}

interface Draft {
  notes: string;
  topics: SessionTopic[];
}

function Planner() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [unscheduled, setUnscheduled] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPlan, setShowPlan] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadUnscheduled = useCallback(async () => {
    try {
      const t = await apiFetch("/topics/unscheduled");
      setUnscheduled(t as Topic[]);
    } catch {
      // Unscheduled strip is non-critical; leave it as-is on failure.
    }
  }, []);

  useEffect(() => {
    async function loadWeek() {
      setLoading(true);
      setError("");
      try {
        const s = await apiFetch(`/sessions?weekStart=${weekStart.toISOString()}`);
        setSessions(s as Session[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load planner");
      } finally {
        setLoading(false);
      }
    }
    loadWeek();
  }, [weekStart]);

  useEffect(() => {
    loadUnscheduled();
  }, [loadUnscheduled]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const days = useMemo(
    () =>
      DAY_LABELS.map((label, i) => {
        const date = new Date(weekStart.getTime() + i * DAY);
        const daySessions = sessions
          .filter((s) => sameDay(new Date(s.date), date))
          .sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]);
        return { label, date, sessions: daySessions };
      }),
    [weekStart, sessions],
  );

  function shiftWeek(deltaWeeks: number) {
    setWeekStart((prev) => mondayOf(new Date(prev.getTime() + deltaWeeks * 7 * DAY)));
  }

  function toggleExpand(session: Session) {
    if (expandedId === session._id) {
      setExpandedId(null);
      setDraft(null);
      return;
    }
    setExpandedId(session._id);
    setDraft({ notes: session.notes ?? "", topics: session.topics.map((t) => ({ ...t })) });
    setSaveError("");
  }

  function toggleTopic(index: number) {
    setDraft((d) =>
      d ? { ...d, topics: d.topics.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t)) } : d,
    );
  }

  function setTopicMinutes(index: number, value: string) {
    const mins = Math.max(0, parseInt(value, 10) || 0);
    setDraft((d) =>
      d ? { ...d, topics: d.topics.map((t, i) => (i === index ? { ...t, minutesSpent: mins } : t)) } : d,
    );
  }

  function setNotes(value: string) {
    setDraft((d) => (d ? { ...d, notes: value } : d));
  }

  async function saveSession(session: Session) {
    if (!draft) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = (await apiFetch(`/sessions/${session._id}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ notes: draft.notes, topics: draft.topics }),
      })) as Session;
      setSessions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      setExpandedId(null);
      setDraft(null);
      loadUnscheduled();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setSaving(false);
    }
  }

  const draftTotal = draft ? draft.topics.reduce((sum, t) => sum + (t.minutesSpent || 0), 0) : 0;

  return (
    <div className="planner">
      <div className="planner-header">
        <div>
          <h1>Planner</h1>
          <p className="planner-subtitle">
            Week of {formatDay(weekStart)} - {formatDay(weekEnd)}
          </p>
        </div>
        <div className="planner-nav">
          <button className="planner-nav-btn" onClick={() => shiftWeek(-1)}>
            ← Prev
          </button>
          <button className="planner-nav-btn" onClick={() => shiftWeek(1)}>
            Next →
          </button>
          <button className="planner-plan-btn" onClick={() => setShowPlan(true)}>
            Plan this week
          </button>
        </div>
      </div>

      {loading && <p className="planner-msg">Loading planner...</p>}
      {error && !loading && <p className="planner-msg">{error}</p>}

      {!loading && !error && (
        <>
          <div className="unscheduled">
            <p className="unscheduled-label">UNSCHEDULED WORK</p>
            <div className="unscheduled-pills">
              {unscheduled.length === 0 && <span className="unscheduled-empty">Nothing waiting.</span>}
              {unscheduled.map((topic) => (
                <span key={topic._id} className="pill">
                  {topic.name}
                  {topic.revisionCount > 0 ? (
                    <span className="pill-tag">Carried Fwd</span>
                  ) : topic.roadmapId ? (
                    <span className="pill-tag">Roadmap</span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>

          <div className="planner-days">
            {days.map((day) => (
              <div key={day.label} className="day-row">
                <div className="day-label">
                  <span className="day-name">{day.label}</span>
                  <span className="day-date">{day.date.getDate()}</span>
                </div>
                <div className="day-sessions">
                  {day.sessions.length === 0 && <p className="no-sessions">No sessions planned.</p>}
                  {day.sessions.map((session) => {
                    const expanded = expandedId === session._id;
                    return (
                      <div key={session._id} className={`session-card session-card-${session.status}`}>
                        <button
                          type="button"
                          className="session-head"
                          aria-expanded={expanded}
                          onClick={() => toggleExpand(session)}
                        >
                          <div className="session-body">
                            <span className="session-meta">
                              {session.slot.toUpperCase()} · {TRACK_LABELS[session.track]}
                            </span>
                            <span className="session-title">{sessionTitle(session)}</span>
                          </div>
                          <span className={`status-pill status-pill-${session.status}`}>{session.status}</span>
                        </button>

                        {expanded && draft && (
                          <div className="session-detail">
                            {draft.topics.length === 0 && (
                              <p className="detail-hint">No topics on this session — add notes and mark it done.</p>
                            )}
                            {draft.topics.map((topic, i) => (
                              <div key={i} className="topic-row">
                                <label className="topic-check">
                                  <input
                                    type="checkbox"
                                    checked={topic.completed}
                                    onChange={() => toggleTopic(i)}
                                  />
                                  <span className={topic.completed ? "topic-name done" : "topic-name"}>
                                    {topic.name}
                                  </span>
                                </label>
                                <div className="topic-mins">
                                  <input
                                    type="number"
                                    min={0}
                                    value={topic.minutesSpent}
                                    onChange={(e) => setTopicMinutes(i, e.target.value)}
                                  />
                                  <span>min</span>
                                </div>
                              </div>
                            ))}

                            <label className="detail-notes">
                              <span>Notes</span>
                              <textarea
                                rows={2}
                                value={draft.notes}
                                placeholder="How did it go?"
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </label>

                            {saveError && <p className="detail-error">{saveError}</p>}

                            <div className="detail-actions">
                              <span className="detail-total">Total: {draftTotal} min</span>
                              <button className="detail-save" disabled={saving} onClick={() => saveSession(session)}>
                                {saving ? "Saving..." : "Save & Mark Complete"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={showPlan} onClose={() => setShowPlan(false)} title="Plan This Week">
        <p className="planner-msg">Fast bulk-entry coming soon.</p>
      </Modal>
    </div>
  );
}

export default Planner;
