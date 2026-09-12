import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import type { DashboardData, Job, Session, NextAction } from "../types";
import Funnel from "../components/Funnel";
import Heatmap from "../components/Heatmap";
import Modal from "../components/Modal";
import "./Dashboard.css";

const DAY = 24 * 60 * 60 * 1000;

const TRACK_LABELS: Record<Session["track"], string> = { dsa: "DSA", build: "Build", other: "Other" };

function pctInt(value: number) {
  return Math.round(value * 100);
}

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

function relativeDays(value?: string) {
  if (!value) return "never";
  const then = new Date(value).getTime();
  const days = Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function clampPct(actual: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [heatData, setHeatData] = useState<Record<string, number>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [showGoals, setShowGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({ hours: 10, apps: 3, mocks: 2 });
  const [savingGoals, setSavingGoals] = useState(false);

  const load = useCallback(async () => {
    try {
      const from = new Date(Date.now() - 18 * 7 * DAY).toISOString();
      const to = new Date().toISOString();
      const [dash, jobsData, rangeSessions] = await Promise.all([
        apiFetch("/dashboard"),
        apiFetch("/jobs"),
        apiFetch(`/sessions?from=${from}&to=${to}`),
      ]);
      setData(dash as DashboardData);
      setJobs(jobsData as Job[]);
      const buckets: Record<string, number> = {};
      for (const s of rangeSessions as Session[]) {
        if (s.status !== "completed") continue;
        const key = s.date.slice(0, 10);
        buckets[key] = (buckets[key] || 0) + (s.minutesSpent || 0);
      }
      setHeatData(buckets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRevised(topicId: string) {
    setDismissed((prev) => new Set(prev).add(topicId));
    try {
      await apiFetch(`/topics/${topicId}/revise`, { method: "PATCH" });
    } catch {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.delete(topicId);
        return next;
      });
    }
  }

  function handleAction(action: NextAction) {
    navigate(action.link ?? "/revise");
  }

  function openGoals() {
    if (data) {
      setGoalForm({
        hours: Math.round((data.goals.targets.studyMinutesTarget / 60) * 10) / 10,
        apps: data.goals.targets.applicationsTarget,
        mocks: data.goals.targets.mockTarget,
      });
    }
    setShowGoals(true);
  }

  async function saveGoals(e: React.FormEvent) {
    e.preventDefault();
    setSavingGoals(true);
    try {
      await apiFetch("/goals", {
        method: "PUT",
        body: JSON.stringify({
          studyMinutesTarget: Math.round(goalForm.hours * 60),
          applicationsTarget: goalForm.apps,
          mockTarget: goalForm.mocks,
        }),
      });
      setShowGoals(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goals");
    } finally {
      setSavingGoals(false);
    }
  }

  if (loading) return <p className="dash-msg">Loading dashboard...</p>;
  if (error && !data) return <p className="dash-msg">{error}</p>;
  if (!data) return null;

  const { roadmap, todaysSessions, momentum, dueForRevision, goals, nextActions, readiness, remindersDue } = data;
  const due = dueForRevision.filter((d) => !dismissed.has(d.topicId));
  const readinessTone = readiness.score >= 70 ? "high" : readiness.score >= 40 ? "mid" : "low";

  const goalBars = [
    {
      label: "Study",
      actual: `${Math.round((goals.actuals.studyMinutes / 60) * 10) / 10}h`,
      target: `${Math.round((goals.targets.studyMinutesTarget / 60) * 10) / 10}h`,
      pct: clampPct(goals.actuals.studyMinutes, goals.targets.studyMinutesTarget),
    },
    {
      label: "Applications",
      actual: `${goals.actuals.applications}`,
      target: `${goals.targets.applicationsTarget}`,
      pct: clampPct(goals.actuals.applications, goals.targets.applicationsTarget),
    },
    {
      label: "Mocks",
      actual: `${goals.actuals.mocks}`,
      target: `${goals.targets.mockTarget}`,
      pct: clampPct(goals.actuals.mocks, goals.targets.mockTarget),
    },
  ];

  const momentumCards = [
    {
      value: momentum.daysSinceLastApplication == null ? "—" : String(momentum.daysSinceLastApplication),
      unit: momentum.daysSinceLastApplication == null ? "No applications yet" : "days · since last application",
      tone: momentum.daysSinceLastApplication != null && momentum.daysSinceLastApplication >= 14 ? "danger" : "default",
    },
    { value: String(momentum.currentStreak), unit: "days · current streak", tone: "default" },
    {
      value: String(momentum.topicsOverdueCount),
      unit: "topics · overdue for revision",
      tone: momentum.topicsOverdueCount > 0 ? "warning" : "default",
    },
    {
      value: `${momentum.sessionsThisWeek.completed}/${momentum.sessionsThisWeek.planned}`,
      unit: "sessions this week",
      tone: "default",
    },
  ];

  return (
    <div className="dash">
      <div className="dash-head">
        <h1>Dashboard</h1>
        <p className="dash-subtitle">Am I on track overall, what am I doing today, and is anything slipping?</p>
      </div>

      {/* ── Today command strip ─────────────────────────────────────────── */}
      <section className="today-strip">
        <div className="today-main">
          <div className="today-strip-head">
            <h2>Today</h2>
            <span className="today-date">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          {todaysSessions.length === 0 ? (
            <p className="dash-empty">No sessions planned for today. Head to the Planner to schedule some.</p>
          ) : (
            <div className="today-grid">
              {todaysSessions.map((s) => (
                <div key={s._id} className={`today-card today-card-${s.status}`}>
                  <div className="today-card-head">
                    <span className="today-meta">
                      {s.slot.toUpperCase()} · {TRACK_LABELS[s.track]}
                    </span>
                    <span className={`status-pill status-pill-${s.status}`}>{s.status}</span>
                  </div>
                  <div className="today-topics">
                    {s.topics.length === 0 && <span className="today-topic-empty">No topics listed.</span>}
                    {s.topics.map((t, i) => (
                      <span key={i} className={`today-topic ${t.completed ? "done" : ""}`}>
                        {t.completed ? "✓" : "○"} {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {remindersDue.length > 0 && (
            <div className="today-reminders">
              {remindersDue.map((r) => (
                <button
                  key={r._id}
                  className="today-reminder"
                  onClick={() => navigate(r.jobId ? `/jobs/${r.jobId}` : "/jobs")}
                >
                  <span className="today-reminder-dot" />
                  {r.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="today-rail">
          <div className={`readiness-tile readiness-${readinessTone}`} title="Roadmap 35% · Mocks 30% · Revision 20% · Applications 15%">
            <span className="readiness-score">{readiness.score}</span>
            <span className="readiness-label">Readiness</span>
          </div>
          <button className="today-chip" onClick={() => navigate("/revise")}>
            <span className="today-chip-value">{due.length}</span>
            <span className="today-chip-label">revisions due</span>
          </button>
          <button className="today-chip" onClick={() => navigate("/planner")}>
            <span className="today-chip-value">
              {momentum.sessionsThisWeek.completed}/{momentum.sessionsThisWeek.planned}
            </span>
            <span className="today-chip-label">sessions this week</span>
          </button>
        </div>
      </section>

      {/* ── Next actions ────────────────────────────────────────────────── */}
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Next Actions</h2>
        </div>
        {nextActions.length === 0 ? (
          <p className="dash-empty">✓ You're on track — nothing needs attention right now.</p>
        ) : (
          <div className="action-grid">
            {nextActions.map((a) => (
              <button key={a.id} className={`action-card action-${a.severity}`} onClick={() => handleAction(a)}>
                <span className="action-dot" />
                <span className="action-text">{a.text}</span>
                <span className="action-arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Roadmap Progress ────────────────────────────────────────────── */}
      {roadmap && (
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Roadmap Progress</h2>
            <span className="dash-card-meta">
              Weeks Elapsed: {roadmap.weeksElapsed} · Remaining: {roadmap.weeksRemaining} · Overall:{" "}
              {pctInt(roadmap.overallCompletion)}%
            </span>
          </div>

          <div className="phase-mini-grid">
            {roadmap.phases.map((phase) => (
              <div key={phase.name} className={`phase-mini ${phase.status === "active" ? "phase-mini-current" : ""}`}>
                <div className="phase-mini-top">
                  <span className="phase-mini-name">{phase.name}</span>
                  <span className="phase-mini-pct">{pctInt(phase.completion)}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${phase.behindSchedule ? "progress-fill-warn" : ""}`}
                    style={{ width: `${pctInt(phase.completion)}%` }}
                  />
                </div>
                <span className="phase-mini-sub">
                  {formatDate(phase.startDate)} – {formatDate(phase.endDate)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Weekly Goals ────────────────────────────────────────────────── */}
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Weekly Goals</h2>
          <button className="goals-edit-btn" onClick={openGoals}>
            Edit
          </button>
        </div>
        <div className="goals-grid">
          {goalBars.map((g) => (
            <div key={g.label} className="goal-item">
              <div className="goal-item-top">
                <span className="goal-label">{g.label}</span>
                <span className="goal-values">
                  <strong className={g.pct >= 100 ? "goal-met" : ""}>{g.actual}</strong> / {g.target}
                </span>
              </div>
              <div className="progress-track">
                <div className={`progress-fill ${g.pct >= 100 ? "progress-fill-done" : ""}`} style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Study Activity heatmap ──────────────────────────────────────── */}
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Study Activity</h2>
          <span className="dash-card-meta">last 18 weeks</span>
        </div>
        <Heatmap data={heatData} />
      </section>

      {/* ── Momentum Signals ────────────────────────────────────────────── */}
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Momentum Signals</h2>
        </div>
        <div className="momentum-grid">
          {momentumCards.map((card, i) => (
            <div key={i} className={`momentum-card momentum-${card.tone}`}>
              <span className="momentum-value">{card.value}</span>
              <span className="momentum-unit">{card.unit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Job Funnel ──────────────────────────────────────────────────── */}
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Job Funnel</h2>
        </div>
        <Funnel jobs={jobs} />
      </section>

      {/* ── Due for Revision ────────────────────────────────────────────── */}
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Due for Revision</h2>
          <span className="dash-card-meta">{due.length} pending</span>
        </div>
        {due.length === 0 ? (
          <p className="dash-empty">Nothing due — spaced repetition is up to date.</p>
        ) : (
          <div className="revision-list">
            {due.slice(0, 6).map((d) => (
              <div
                key={d.topicId}
                className="revision-row"
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/topics/${d.topicId}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/topics/${d.topicId}`);
                }}
              >
                <div className="revision-info">
                  <span className="revision-name">{d.name}</span>
                  <span className="revision-sub">
                    Last studied {relativeDays(d.lastStudiedAt)} · Revised {d.revisionCount}×
                  </span>
                </div>
                <button
                  className="revision-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    markRevised(d.topicId);
                  }}
                >
                  Mark Revised
                </button>
              </div>
            ))}
            {due.length > 6 && <p className="revision-more">+{due.length - 6} more due for revision</p>}
          </div>
        )}
      </section>

      <Modal isOpen={showGoals} onClose={() => setShowGoals(false)} title="Weekly Goals">
        <form className="goals-form" onSubmit={saveGoals}>
          <label className="goals-field">
            <span>Study hours / week</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={goalForm.hours}
              onChange={(e) => setGoalForm((f) => ({ ...f, hours: Number(e.target.value) }))}
            />
          </label>
          <label className="goals-field">
            <span>Applications / week</span>
            <input
              type="number"
              min={0}
              value={goalForm.apps}
              onChange={(e) => setGoalForm((f) => ({ ...f, apps: Number(e.target.value) }))}
            />
          </label>
          <label className="goals-field">
            <span>Mocks / week</span>
            <input
              type="number"
              min={0}
              value={goalForm.mocks}
              onChange={(e) => setGoalForm((f) => ({ ...f, mocks: Number(e.target.value) }))}
            />
          </label>
          <button type="submit" className="goals-save" disabled={savingGoals}>
            {savingGoals ? "Saving..." : "Save Goals"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Dashboard;
