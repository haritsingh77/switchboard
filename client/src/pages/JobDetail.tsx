import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api";
import type { Job, InterviewRound, Reminder, Topic, RoundType, RoundOutcome, RejectionReason } from "../types";
import "./JobDetail.css";

const ROUND_TYPES: { value: RoundType; label: string }[] = [
  { value: "phone", label: "Phone screen" },
  { value: "coding", label: "Coding" },
  { value: "system-design", label: "System design" },
  { value: "behavioral", label: "Behavioral" },
  { value: "hr", label: "HR" },
  { value: "onsite", label: "Onsite" },
  { value: "take-home", label: "Take-home" },
  { value: "other", label: "Other" },
];
const ROUND_OUTCOMES: RoundOutcome[] = ["pending", "passed", "failed", "cancelled"];
const REJECTION_REASONS: RejectionReason[] = [
  "culture",
  "experience",
  "skill-gap",
  "compensation",
  "location",
  "ghosted",
  "other",
];

function label(v: string) {
  return v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, " ");
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function dateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTopicPicker, setShowTopicPicker] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [j, r, t] = await Promise.all([
        apiFetch(`/jobs/${id}`),
        apiFetch(`/reminders?jobId=${id}`),
        apiFetch("/topics"),
      ]);
      setJob(j as Job);
      setReminders(r as Reminder[]);
      setTopics(t as Topic[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveJob(patch: Partial<Job>) {
    if (!id) return;
    const updated = (await apiFetch(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(patch) })) as Job;
    setJob(updated);
  }

  // ── Interview rounds ──
  function addRound() {
    const rounds = [...(job?.rounds || []), { type: "phone", outcome: "pending" } as InterviewRound];
    saveJob({ rounds });
  }
  function updateRound(i: number, patch: Partial<InterviewRound>) {
    const rounds = (job?.rounds || []).map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    saveJob({ rounds });
  }
  function removeRound(i: number) {
    const rounds = (job?.rounds || []).filter((_, idx) => idx !== i);
    saveJob({ rounds });
  }

  // ── Relevant topics ──
  function toggleTopic(topicId: string) {
    const current = job?.relevantTopicIds || [];
    const next = current.includes(topicId) ? current.filter((x) => x !== topicId) : [...current, topicId];
    saveJob({ relevantTopicIds: next });
  }

  // ── Reminders ──
  async function addReminder(title: string, dueDate: string) {
    const created = (await apiFetch("/reminders", {
      method: "POST",
      body: JSON.stringify({ title, dueDate: new Date(dueDate).toISOString(), jobId: id }),
    })) as Reminder;
    setReminders((prev) => [...prev, created]);
  }
  async function toggleReminder(r: Reminder) {
    const updated = (await apiFetch(`/reminders/${r._id}`, {
      method: "PATCH",
      body: JSON.stringify({ done: !r.done }),
    })) as Reminder;
    setReminders((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
  }
  async function deleteReminder(rid: string) {
    await apiFetch(`/reminders/${rid}`, { method: "DELETE" });
    setReminders((prev) => prev.filter((x) => x._id !== rid));
  }

  if (loading) return <p className="jd-msg">Loading job...</p>;
  if (error) return <p className="jd-msg">{error}</p>;
  if (!job) return null;

  const relevant = topics.filter((t) => (job.relevantTopicIds || []).includes(t._id));

  return (
    <div className="job-detail">
      <Link to="/jobs" className="jd-back">
        ← Back to Jobs
      </Link>

      <div className="jd-head">
        <div>
          <h1>{job.title}</h1>
          <p className="jd-sub">
            {[job.company, job.city].filter(Boolean).join(" · ")}
            {job.package ? ` · ${job.package} LPA` : ""}
          </p>
        </div>
        <div className="jd-status">
          <select value={job.status} onChange={(e) => saveJob({ status: e.target.value as Job["status"] })}>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {job.status === "rejected" && (
        <div className="jd-rejection">
          <span>Rejection reason</span>
          <select
            value={job.rejectionReason || ""}
            onChange={(e) => saveJob({ rejectionReason: (e.target.value || null) as RejectionReason | null })}
          >
            <option value="">Not set</option>
            {REJECTION_REASONS.map((r) => (
              <option key={r} value={r}>
                {label(r)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Interview rounds */}
      <section className="jd-card">
        <div className="jd-card-head">
          <h2>Interview Rounds</h2>
          <button className="jd-add" onClick={addRound}>
            + Add Round
          </button>
        </div>
        {(job.rounds || []).length === 0 ? (
          <p className="jd-empty">No rounds yet. Add one as the pipeline progresses.</p>
        ) : (
          <div className="round-list">
            {(job.rounds || []).map((r, i) => (
              <div key={i} className={`round-row round-${r.outcome}`}>
                <div className="round-marker" />
                <div className="round-body">
                  <div className="round-controls">
                    <select value={r.type} onChange={(e) => updateRound(i, { type: e.target.value as RoundType })}>
                      {ROUND_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={dateInput(r.date)}
                      onChange={(e) => updateRound(i, { date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    />
                    <select value={r.outcome} onChange={(e) => updateRound(i, { outcome: e.target.value as RoundOutcome })}>
                      {ROUND_OUTCOMES.map((o) => (
                        <option key={o} value={o}>
                          {label(o)}
                        </option>
                      ))}
                    </select>
                    <button className="round-remove" aria-label="Remove round" onClick={() => removeRound(i)}>
                      ×
                    </button>
                  </div>
                  <textarea
                    className="round-notes"
                    rows={2}
                    placeholder="Notes — what was asked, how it went, what to improve…"
                    defaultValue={r.notes || ""}
                    onBlur={(e) => e.target.value !== (r.notes || "") && updateRound(i, { notes: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Relevant topics */}
      <section className="jd-card">
        <div className="jd-card-head">
          <h2>Prep Topics</h2>
          <button className="jd-add" onClick={() => setShowTopicPicker((v) => !v)}>
            {showTopicPicker ? "Done" : "Edit"}
          </button>
        </div>
        {!showTopicPicker ? (
          relevant.length === 0 ? (
            <p className="jd-empty">Link roadmap topics you're studying for this role.</p>
          ) : (
            <div className="jd-topic-chips">
              {relevant.map((t) => (
                <Link key={t._id} to={`/topics/${t._id}`} className="jd-topic-chip">
                  {t.name}
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="jd-topic-picker">
            {topics.map((t) => {
              const on = (job.relevantTopicIds || []).includes(t._id);
              return (
                <label key={t._id} className={`jd-topic-opt ${on ? "on" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleTopic(t._id)} />
                  <span>{t.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </section>

      {/* Post-interview debrief */}
      <section className="jd-card">
        <div className="jd-card-head">
          <h2>Post-interview Debrief</h2>
        </div>
        <DebriefForm topics={topics} defaultTopicIds={job.relevantTopicIds || []} />
      </section>

      {/* Follow-ups */}
      <section className="jd-card">
        <div className="jd-card-head">
          <h2>Follow-ups</h2>
        </div>
        <ReminderForm onAdd={addReminder} />
        {reminders.length === 0 ? (
          <p className="jd-empty">No follow-ups scheduled.</p>
        ) : (
          <div className="reminder-list">
            {reminders.map((r) => {
              const overdue = !r.done && new Date(r.dueDate).getTime() < Date.now();
              return (
                <div key={r._id} className={`reminder-row ${r.done ? "done" : ""}`}>
                  <label className="reminder-check">
                    <input type="checkbox" checked={r.done} onChange={() => toggleReminder(r)} />
                    <span className="reminder-title">{r.title}</span>
                  </label>
                  <span className={`reminder-due ${overdue ? "overdue" : ""}`}>
                    {overdue ? "overdue · " : ""}
                    {formatDate(r.dueDate)}
                  </span>
                  <button className="reminder-del" aria-label="Delete" onClick={() => deleteReminder(r._id)}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ReminderForm({ onAdd }: { onAdd: (title: string, dueDate: string) => void }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !due) return;
    onAdd(title.trim(), due);
    setTitle("");
  }

  return (
    <form className="reminder-form" onSubmit={submit}>
      <input
        type="text"
        placeholder="e.g. Follow up with recruiter"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
}

function DebriefForm({ topics, defaultTopicIds }: { topics: Topic[]; defaultTopicIds: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultTopicIds);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function toggle(id: string) {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function save() {
    if (selected.length === 0) return;
    setSaving(true);
    setMsg("");
    try {
      const items = selected.map((id) => {
        const t = topics.find((x) => x._id === id);
        return { topicId: id, topicName: t?.name, kind: "problem", correct: false };
      });
      await apiFetch("/mocks/mini", {
        method: "POST",
        body: JSON.stringify({ date: new Date().toISOString(), items }),
      });
      setMsg(`Flagged ${selected.length} topic${selected.length > 1 ? "s" : ""} for review — they'll surface in Revise.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to save debrief");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="debrief">
      <p className="debrief-hint">
        Mark the topics that came up or that you struggled with — this flags them as weak and surfaces them in Revise.
      </p>
      <input
        type="text"
        className="debrief-filter"
        placeholder="Filter topics…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="jd-topic-picker">
        {topics
          .filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()))
          .map((t) => {
            const on = selected.includes(t._id);
            return (
              <label key={t._id} className={`jd-topic-opt ${on ? "on" : ""}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(t._id)} />
                <span>{t.name}</span>
              </label>
            );
          })}
      </div>
      {msg && <p className="debrief-msg">{msg}</p>}
      <button className="debrief-save" disabled={saving || selected.length === 0} onClick={save}>
        {saving ? "Saving..." : `Flag ${selected.length} for review`}
      </button>
    </div>
  );
}

export default JobDetail;
