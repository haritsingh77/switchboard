import { useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "../api";
import type { Session, Topic, SessionTopic } from "../types";
import Modal from "../components/Modal";
import "./Planner.css";

const DAY = 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_PLAN_ROWS = 7;
const TRACK_LABELS: Record<Session["track"], string> = { dsa: "DSA", build: "Build", other: "Other" };
const SLOT_ORDER: Record<Session["slot"], number> = { morning: 0, evening: 1 };

// Quick session presets (track + typical planned minutes).
const SESSION_TEMPLATES: { label: string; track: Session["track"]; plannedMinutes: number }[] = [
  { label: "DSA Grind — 90m", track: "dsa", plannedMinutes: 90 },
  { label: "Quick DSA — 45m", track: "dsa", plannedMinutes: 45 },
  { label: "Build Session — 120m", track: "build", plannedMinutes: 120 },
  { label: "System Design — 60m", track: "other", plannedMinutes: 60 },
  { label: "Behavioral + Resume — 45m", track: "other", plannedMinutes: 45 },
];

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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function sessionTitle(session: Session) {
  const names = session.topics.map((t) => t.name).filter(Boolean);
  if (names.length) return names.join(", ");
  return TRACK_LABELS[session.track];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function elapsedMin(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

type Draft = {
  notes: string;
  topics: SessionTopic[];
  focusRating: number;
};

type PlanRow = {
  dayIndex: number;
  slot: Session["slot"];
  track: Session["track"];
  topics: string;
  plannedMinutes: number;
};

type RowIssue = "empty" | "duplicate" | "collision" | null;

const ISSUE_TEXT: Record<Exclude<RowIssue, null>, string> = {
  empty: "Add at least one topic, or remove this row.",
  duplicate: "Duplicate of another row above (same day, slot & track).",
  collision: "This day + slot + track already has a session this week.",
};

function newPlanRow(): PlanRow {
  return { dayIndex: 0, slot: "morning", track: "dsa", topics: "", plannedMinutes: 0 };
}

function parseTopics(input: string): SessionTopic[] {
  return input
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, completed: false, minutesSpent: 0 }));
}

function rowIsDefault(row: PlanRow) {
  return (
    row.dayIndex === 0 && row.slot === "morning" && row.track === "dsa" && row.topics.trim() === ""
  );
}

function Planner() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [unscheduled, setUnscheduled] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showPlan, setShowPlan] = useState(false);
  const [planRows, setPlanRows] = useState<PlanRow[]>([newPlanRow()]);
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState("");
  // Validation stays silent until the user actually attempts to save.
  const [planAttempted, setPlanAttempted] = useState(false);

  // Drag-and-drop scheduling from the unscheduled strip.
  const [draggingTopic, setDraggingTopic] = useState<{ id: string; name: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [dropForm, setDropForm] = useState<
    {
      dayIndex: number;
      id: string;
      name: string;
      slot: Session["slot"];
      track: Session["track"];
      plannedMinutes: number;
    } | null
  >(null);
  const [dropSaving, setDropSaving] = useState(false);
  const [dropError, setDropError] = useState("");

  const loadUnscheduled = useCallback(async () => {
    try {
      const t = await apiFetch("/topics/unscheduled");
      setUnscheduled(t as Topic[]);
    } catch {
      // Unscheduled strip is non-critical; leave it as-is on failure.
    }
  }, []);

  const loadWeek = useCallback(async () => {
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
  }, [weekStart]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

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
    setDraft({
      notes: session.notes ?? "",
      topics: session.topics.map((t) => ({ ...t })),
      focusRating: session.focusRating ?? 0,
    });
    setSaveError("");
  }

  function setFocusRating(value: number) {
    setDraft((d) => (d ? { ...d, focusRating: value } : d));
  }

  async function startSession(session: Session) {
    try {
      const updated = (await apiFetch(`/sessions/${session._id}`, {
        method: "PATCH",
        body: JSON.stringify({ startedAt: new Date().toISOString() }),
      })) as Session;
      setSessions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    } catch {
      // non-critical
    }
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
        body: JSON.stringify({
          notes: draft.notes,
          topics: draft.topics,
          focusRating: draft.focusRating || undefined,
        }),
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

  function onPillDragStart(e: React.DragEvent, topic: Topic) {
    e.dataTransfer.setData("text/plain", topic._id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingTopic({ id: topic._id, name: topic.name });
  }

  function onPillDragEnd() {
    setDraggingTopic(null);
    setDragOverDay(null);
  }

  function onDayDragOver(e: React.DragEvent, dayIndex: number) {
    if (!draggingTopic) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDay !== dayIndex) setDragOverDay(dayIndex);
  }

  function onDayDrop(e: React.DragEvent, dayIndex: number) {
    e.preventDefault();
    if (!draggingTopic) return;
    setDropForm({ dayIndex, id: draggingTopic.id, name: draggingTopic.name, slot: "morning", track: "dsa", plannedMinutes: 0 });
    setDropError("");
    setDraggingTopic(null);
    setDragOverDay(null);
  }

  async function confirmDrop() {
    if (!dropForm) return;
    setDropSaving(true);
    setDropError("");
    try {
      const date = new Date(weekStart.getTime() + dropForm.dayIndex * DAY);
      // If a session already occupies this day + slot + track, add the topic to it
      // (a slot can hold several topics); otherwise create a fresh session.
      const existing = sessions.find(
        (s) => sameDay(new Date(s.date), date) && s.slot === dropForm.slot && s.track === dropForm.track,
      );
      if (existing) {
        await apiFetch(`/sessions/${existing._id}/add-topic`, {
          method: "PATCH",
          body: JSON.stringify({ topicId: dropForm.id, name: dropForm.name }),
        });
      } else {
        await apiFetch("/sessions/bulk", {
          method: "POST",
          body: JSON.stringify({
            sessions: [
              {
                date: date.toISOString(),
                slot: dropForm.slot,
                track: dropForm.track,
                plannedMinutes: dropForm.plannedMinutes || 0,
                topics: [{ topicId: dropForm.id, name: dropForm.name, completed: false, minutesSpent: 0 }],
              },
            ],
          }),
        });
      }
      setDropForm(null);
      await loadWeek();
      loadUnscheduled();
    } catch (err) {
      setDropError(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setDropSaving(false);
    }
  }

  // Does the drop chooser's current day+slot+track already have a session?
  const dropMatchesExisting = useMemo(() => {
    if (!dropForm) return false;
    const date = new Date(weekStart.getTime() + dropForm.dayIndex * DAY);
    return sessions.some(
      (s) => sameDay(new Date(s.date), date) && s.slot === dropForm.slot && s.track === dropForm.track,
    );
  }, [dropForm, sessions, weekStart]);

  const draftTotal = draft ? draft.topics.reduce((sum, t) => sum + (t.minutesSpent || 0), 0) : 0;

  // Slots already taken by existing sessions this week — keyed day|slot|track.
  const occupiedSlots = useMemo(() => {
    const set = new Set<string>();
    days.forEach((day, i) => {
      day.sessions.forEach((s) => set.add(`${i}|${s.slot}|${s.track}`));
    });
    return set;
  }, [days]);

  // Per-row validation, recomputed live so highlights update as the user types.
  const rowIssues = useMemo<RowIssue[]>(() => {
    const seen = new Set<string>();
    return planRows.map((row) => {
      if (parseTopics(row.topics).length === 0) return "empty";
      const key = `${row.dayIndex}|${row.slot}|${row.track}`;
      if (occupiedSlots.has(key)) return "collision";
      if (seen.has(key)) return "duplicate";
      seen.add(key);
      return null;
    });
  }, [planRows, occupiedSlots]);

  const hasRowIssues = rowIssues.some(Boolean);
  const planDirty = planRows.length > 1 || planRows.some((r) => !rowIsDefault(r));

  function openPlan() {
    setPlanError("");
    setPlanAttempted(false);
    setShowPlan(true);
  }

  function requestClosePlan() {
    if (planDirty && !window.confirm("Discard this unsaved plan? Your entered rows will be lost.")) return;
    setShowPlan(false);
    setPlanRows([newPlanRow()]);
    setPlanError("");
    setPlanAttempted(false);
  }

  function updatePlanRow(index: number, patch: Partial<PlanRow>) {
    setPlanRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addPlanRow() {
    setPlanRows((rows) => [...rows, newPlanRow()]);
  }

  function removePlanRow(index: number) {
    setPlanRows((rows) => (rows.length === 1 ? rows : rows.filter((_, i) => i !== index)));
  }

  async function savePlan() {
    setPlanAttempted(true);
    if (hasRowIssues) {
      const empty = rowIssues.filter((x) => x === "empty").length;
      const dupes = rowIssues.filter((x) => x === "duplicate" || x === "collision").length;
      const parts: string[] = [];
      if (empty) parts.push(`${empty} row${empty > 1 ? "s" : ""} with no topics`);
      if (dupes) parts.push(`${dupes} duplicate/occupied slot${dupes > 1 ? "s" : ""}`);
      setPlanError(`Fix ${parts.join(" and ")} before saving.`);
      return;
    }

    const payload = planRows.map((row) => {
      const date = new Date(weekStart.getTime() + row.dayIndex * DAY);
      return {
        date: date.toISOString(),
        slot: row.slot,
        track: row.track,
        plannedMinutes: row.plannedMinutes || 0,
        topics: parseTopics(row.topics),
      };
    });

    setPlanSaving(true);
    setPlanError("");
    try {
      await apiFetch("/sessions/bulk", {
        method: "POST",
        body: JSON.stringify({ sessions: payload }),
      });
      setShowPlan(false);
      setPlanRows([newPlanRow()]);
      await loadWeek();
      loadUnscheduled();
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setPlanSaving(false);
    }
  }

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
          <button className="planner-plan-btn" onClick={openPlan}>
            Plan this week
          </button>
        </div>
      </div>

      {loading && <p className="planner-msg">Loading planner...</p>}
      {error && !loading && <p className="planner-msg">{error}</p>}

      {!loading && !error && (
        <>
          <div className="unscheduled">
            <p className="unscheduled-label">
              UNSCHEDULED WORK
              {unscheduled.length > 0 && <span className="unscheduled-hint"> · drag a topic onto a day to schedule it</span>}
            </p>
            <div className="unscheduled-pills">
              {unscheduled.length === 0 && <span className="unscheduled-empty">Nothing waiting.</span>}
              {unscheduled.map((topic) => (
                <span
                  key={topic._id}
                  className={`pill pill-draggable${draggingTopic?.id === topic._id ? " pill-dragging" : ""}`}
                  draggable
                  onDragStart={(e) => onPillDragStart(e, topic)}
                  onDragEnd={onPillDragEnd}
                >
                  <span className="pill-grip" aria-hidden="true">
                    ⠿
                  </span>
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
            {days.map((day, dayIndex) => (
              <div
                key={day.label}
                className={`day-row${draggingTopic ? " day-row-armed" : ""}${
                  dragOverDay === dayIndex ? " day-row-over" : ""
                }`}
                onDragOver={(e) => onDayDragOver(e, dayIndex)}
                onDragLeave={() => setDragOverDay((d) => (d === dayIndex ? null : d))}
                onDrop={(e) => onDayDrop(e, dayIndex)}
              >
                <div className="day-label">
                  <span className="day-name">{day.label}</span>
                  <span className="day-date">{day.date.getDate()}</span>
                </div>
                <div className="day-sessions">
                  {dropForm && dropForm.dayIndex === dayIndex && (
                    <div className="drop-form">
                      <div className="drop-form-head">
                        <span className="drop-form-topic">{dropForm.name}</span>
                        <button className="drop-form-x" aria-label="Cancel" onClick={() => setDropForm(null)}>
                          ×
                        </button>
                      </div>
                      {!dropMatchesExisting && (
                        <select
                          className="drop-form-template"
                          value=""
                          onChange={(e) => {
                            const t = SESSION_TEMPLATES[Number(e.target.value)];
                            if (t) setDropForm((f) => (f ? { ...f, track: t.track, plannedMinutes: t.plannedMinutes } : f));
                          }}
                        >
                          <option value="">Template…</option>
                          {SESSION_TEMPLATES.map((t, idx) => (
                            <option key={idx} value={idx}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="drop-form-controls">
                        <select
                          value={dropForm.slot}
                          onChange={(e) => setDropForm((f) => (f ? { ...f, slot: e.target.value as Session["slot"] } : f))}
                        >
                          <option value="morning">Morning</option>
                          <option value="evening">Evening</option>
                        </select>
                        <select
                          value={dropForm.track}
                          onChange={(e) => setDropForm((f) => (f ? { ...f, track: e.target.value as Session["track"] } : f))}
                        >
                          <option value="dsa">DSA</option>
                          <option value="build">Build</option>
                          <option value="other">Other</option>
                        </select>
                        <button className="drop-form-confirm" disabled={dropSaving} onClick={confirmDrop}>
                          {dropSaving ? "Saving..." : dropMatchesExisting ? "Add to session" : "Schedule"}
                        </button>
                      </div>
                      {!dropMatchesExisting && dropForm.plannedMinutes > 0 && (
                        <p className="drop-form-hint">Planned {dropForm.plannedMinutes} min.</p>
                      )}
                      {dropMatchesExisting && !dropError && (
                        <p className="drop-form-hint">Adds to the existing {dropForm.slot} · {TRACK_LABELS[dropForm.track]} session.</p>
                      )}
                      {dropError && <p className="drop-form-error">{dropError}</p>}
                    </div>
                  )}
                  {day.sessions.length === 0 && !(dropForm && dropForm.dayIndex === dayIndex) && (
                    <p className="no-sessions">{draggingTopic ? "Drop here to schedule" : "No sessions planned."}</p>
                  )}
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
                            {session.topics.length > 0 ? (
                              <div className="session-topic-lines">
                                {session.topics.map((t, i) => (
                                  <span key={i} className={`session-topic-line${t.completed ? " done" : ""}`}>
                                    {t.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="session-title">{sessionTitle(session)}</span>
                            )}
                            {session.status === "completed" ? (
                              <span className="session-sub">
                                {session.minutesSpent}m
                                {session.plannedMinutes ? ` / ${session.plannedMinutes}m planned` : ""}
                                {session.focusRating ? ` · focus ${"★".repeat(session.focusRating)}` : ""}
                              </span>
                            ) : session.plannedMinutes || session.startedAt ? (
                              <span className="session-sub">
                                {session.plannedMinutes ? `planned ${session.plannedMinutes}m` : ""}
                                {session.startedAt
                                  ? `${session.plannedMinutes ? " · " : ""}▶ started ${formatTime(session.startedAt)}`
                                  : ""}
                              </span>
                            ) : null}
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
                                  <input type="checkbox" checked={topic.completed} onChange={() => toggleTopic(i)} />
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

                            <div className="detail-timing">
                              {session.status !== "completed" &&
                                (!session.startedAt ? (
                                  <button type="button" className="detail-start" onClick={() => startSession(session)}>
                                    ▶ Start
                                  </button>
                                ) : (
                                  <span className="detail-started">
                                    Started {formatTime(session.startedAt)} · ~{elapsedMin(session.startedAt)}m
                                  </span>
                                ))}
                              <span className="detail-total">
                                Actual {draftTotal}m
                                {session.plannedMinutes ? ` / ${session.plannedMinutes}m planned` : ""}
                              </span>
                            </div>

                            <div className="detail-focus">
                              <span className="detail-focus-label">Focus</span>
                              <div className="focus-stars">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    className={`focus-star${draft.focusRating >= n ? " on" : ""}`}
                                    aria-label={`${n} of 5`}
                                    onClick={() => setFocusRating(draft.focusRating === n ? 0 : n)}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>

                            {saveError && <p className="detail-error">{saveError}</p>}

                            <div className="detail-actions">
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

      <Modal isOpen={showPlan} onClose={requestClosePlan} title="Plan This Week" size="lg">
        <p className="plan-hint">
          Add multiple sessions across several days at once. Pull topics from the unscheduled strip or type them
          manually.
        </p>

        <div className="plan-rows">
          {planRows.map((row, i) => {
            const issue = planAttempted ? rowIssues[i] : null;
            return (
              <div key={i} className={`plan-card${issue ? ` plan-card-${issue}` : ""}`}>
                <div className="plan-template-row">
                  <select
                    className="plan-template"
                    value=""
                    onChange={(e) => {
                      const t = SESSION_TEMPLATES[Number(e.target.value)];
                      if (t) updatePlanRow(i, { track: t.track, plannedMinutes: t.plannedMinutes });
                    }}
                  >
                    <option value="">Template…</option>
                    {SESSION_TEMPLATES.map((t, idx) => (
                      <option key={idx} value={idx}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {row.plannedMinutes > 0 && <span className="plan-planned">Planned {row.plannedMinutes}m</span>}
                </div>
                <div className="plan-fields">
                  <label className="plan-field plan-field-sm">
                    <span className="plan-field-label">Day</span>
                    <select
                      className="plan-select"
                      value={row.dayIndex}
                      onChange={(e) => updatePlanRow(i, { dayIndex: Number(e.target.value) })}
                    >
                      {days.map((day, idx) => (
                        <option key={day.label} value={idx}>
                          {day.label} {day.date.getDate()}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="plan-field plan-field-sm">
                    <span className="plan-field-label">Slot</span>
                    <select
                      className="plan-select"
                      value={row.slot}
                      onChange={(e) => updatePlanRow(i, { slot: e.target.value as Session["slot"] })}
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                    </select>
                  </label>

                  <label className="plan-field plan-field-sm">
                    <span className="plan-field-label">Track</span>
                    <select
                      className="plan-select"
                      value={row.track}
                      onChange={(e) => updatePlanRow(i, { track: e.target.value as Session["track"] })}
                    >
                      <option value="dsa">DSA</option>
                      <option value="build">Build</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="plan-field plan-field-topics">
                    <span className="plan-field-label">Topics (comma separated)</span>
                    <textarea
                      className="plan-input"
                      rows={2}
                      value={row.topics}
                      placeholder="e.g. BFS Traversal, DFS Traversal, Graph Valid Tree"
                      onChange={(e) => updatePlanRow(i, { topics: e.target.value })}
                    />
                  </label>

                  <button
                    type="button"
                    className="plan-remove"
                    aria-label="Remove session row"
                    disabled={planRows.length === 1}
                    onClick={() => removePlanRow(i)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6m3 5v6m4-6v6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {issue && <p className="plan-issue">{ISSUE_TEXT[issue]}</p>}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="plan-add-row"
          disabled={planRows.length >= MAX_PLAN_ROWS}
          onClick={addPlanRow}
        >
          + Add Session Row ({planRows.length}/{MAX_PLAN_ROWS})
        </button>

        {planAttempted && planError && <p className="detail-error plan-error">{planError}</p>}

        <div className="plan-footer">
          <button type="button" className="plan-cancel" onClick={requestClosePlan}>
            Cancel
          </button>
          <button type="button" className="plan-save" disabled={planSaving} onClick={savePlan}>
            {planSaving ? "Saving..." : "Save Plan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Planner;
