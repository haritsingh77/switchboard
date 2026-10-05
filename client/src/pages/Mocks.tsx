import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import type { FullMock, MiniCheck, FullMockScores, Topic } from "../types";
import Modal from "../components/Modal";
import ScoreTrend from "../features/mocks/ScoreTrend";
import "./Mocks.css";

// Which roadmap-topic keywords back each mock axis, for focus suggestions.
const AXIS_TOPIC_KEYWORDS: Record<keyof FullMockScores, string[]> = {
  dsa: ["DSA"],
  concepts: ["JavaScript", "TypeScript", "React"],
  complexity: ["DSA", "Dynamic Programming"],
  architecture: ["System Design", "Node", "Express", "Docker", "Deployment"],
};

const SCORE_KEYS: (keyof FullMockScores)[] = ["dsa", "concepts", "complexity", "architecture"];
const SCORE_LABELS: Record<keyof FullMockScores, string> = {
  dsa: "DSA",
  concepts: "Concepts",
  complexity: "Complexity",
  architecture: "Architecture",
};
const FULL_MOCK_CADENCE_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

function avg(scores: FullMockScores) {
  return Math.round((scores.dsa + scores.concepts + scores.complexity + scores.architecture) / 4);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

interface TopicStat {
  name: string;
  timesTested: number;
  correct: number;
  lastTested: string;
}

function Mocks() {
  const [fullMocks, setFullMocks] = useState<FullMock[]>([]);
  const [miniChecks, setMiniChecks] = useState<MiniCheck[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRecord, setShowRecord] = useState(false);

  async function load() {
    try {
      const [full, mini, t] = await Promise.all([
        apiFetch("/mocks/full"),
        apiFetch("/mocks/mini"),
        apiFetch("/topics"),
      ]);
      setFullMocks(full as FullMock[]);
      setMiniChecks(mini as MiniCheck[]);
      setTopics(t as Topic[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mocks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Full mocks come back sorted newest-first from the API.
  const latest = fullMocks[0] ?? null;
  const previous = fullMocks[1] ?? null;

  const nextMock = useMemo(() => {
    if (!latest) return null;
    const dueMs = new Date(latest.date).getTime() + FULL_MOCK_CADENCE_DAYS * DAY;
    return Math.round((dueMs - Date.now()) / DAY);
  }, [latest]);

  const topicStats = useMemo<TopicStat[]>(() => {
    const map = new Map<string, TopicStat>();
    for (const check of miniChecks) {
      for (const item of check.items || []) {
        const name = item.topicName || "General";
        const stat = map.get(name) || { name, timesTested: 0, correct: 0, lastTested: check.date };
        stat.timesTested += 1;
        if (item.correct) stat.correct += 1;
        if (new Date(check.date) > new Date(stat.lastTested)) stat.lastTested = check.date;
        map.set(name, stat);
      }
    }
    return [...map.values()].sort((a, b) => b.timesTested - a.timesTested);
  }, [miniChecks]);

  // Focus suggestion: the weakest axis averaged over the last 3 full mocks, plus
  // the roadmap topics that back it.
  const focus = useMemo(() => {
    const recent = fullMocks.slice(0, 3);
    if (recent.length === 0) return null;
    const axes = SCORE_KEYS.map((key) => ({
      key,
      avg: Math.round(recent.reduce((s, m) => s + (m.scores[key] || 0), 0) / recent.length),
    }));
    const weakest = axes.reduce((a, b) => (b.avg < a.avg ? b : a));
    const keywords = AXIS_TOPIC_KEYWORDS[weakest.key];
    const related = topics
      .filter((t) => keywords.some((k) => t.name.includes(k)))
      .sort((a, b) => (a.status === "completed" ? 1 : 0) - (b.status === "completed" ? 1 : 0))
      .slice(0, 5);
    return { axis: SCORE_LABELS[weakest.key], avg: weakest.avg, sampleSize: recent.length, related };
  }, [fullMocks, topics]);

  return (
    <div className="mocks">
      <div className="mocks-header">
        <div>
          <h1>Mock Tests</h1>
          <p className="mocks-subtitle">Calibration &amp; frequent signals</p>
        </div>
        <div className="mocks-actions">
          {nextMock != null && (
            <span className={`mocks-next ${nextMock < 0 ? "mocks-next-overdue" : ""}`}>
              {nextMock < 0 ? `Full mock overdue by ${Math.abs(nextMock)}d` : `Next full mock ~${nextMock}d`}
            </span>
          )}
          <button className="mocks-record-btn" onClick={() => setShowRecord(true)}>
            + Record Result
          </button>
        </div>
      </div>

      {loading && <p className="mocks-msg">Loading mocks...</p>}
      {error && !loading && <p className="mocks-msg">{error}</p>}

      {!loading && !error && (
        <>
          <section className="mocks-card">
            <div className="mocks-card-head">
              <h2>Score Trend</h2>
              <div className="mocks-legend">
                <span className="legend-item">
                  <span className="legend-dot legend-full" /> Full Mocks
                </span>
                <span className="legend-item">
                  <span className="legend-dot legend-mini" /> Mini-checks
                </span>
              </div>
            </div>
            <ScoreTrend fullMocks={fullMocks} miniChecks={miniChecks} />
          </section>

          <section className="mocks-card">
            <div className="mocks-card-head">
              <h2>Latest Full Mock Breakdown</h2>
              {latest && <span className="mocks-card-meta">{formatDate(latest.date)} · Overall {avg(latest.scores)}%</span>}
            </div>
            {!latest ? (
              <p className="mocks-empty">No full mocks recorded yet.</p>
            ) : (
              <div className="breakdown-grid">
                {SCORE_KEYS.map((key) => {
                  const score = latest.scores[key];
                  const delta = previous ? score - previous.scores[key] : null;
                  return (
                    <div key={key} className="breakdown-box">
                      <span className="breakdown-label">{SCORE_LABELS[key]}</span>
                      <span className="breakdown-score">{score}%</span>
                      {delta == null ? (
                        <span className="breakdown-delta neutral">baseline</span>
                      ) : (
                        <span className={`breakdown-delta ${delta >= 0 ? "up" : "down"}`}>
                          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {latest?.feedback &&
              (latest.feedback.strengths.length > 0 ||
                latest.feedback.gaps.length > 0 ||
                latest.feedback.actionItems.length > 0) && (
                <div className="feedback-grid">
                  <FeedbackList title="Strengths" items={latest.feedback.strengths} tone="good" />
                  <FeedbackList title="Gaps" items={latest.feedback.gaps} tone="bad" />
                  <FeedbackList title="Action items" items={latest.feedback.actionItems} tone="action" />
                </div>
              )}
            {latest?.notes && <p className="breakdown-notes">{latest.notes}</p>}
            {latest?.topicIds && latest.topicIds.length > 0 && (
              <div className="breakdown-topics">
                <span className="breakdown-topics-label">Topics exercised</span>
                <div className="focus-chips">
                  {latest.topicIds
                    .map((id) => topics.find((t) => t._id === id))
                    .filter((t): t is Topic => Boolean(t))
                    .map((t) => (
                      <Link key={t._id} to={`/topics/${t._id}`} className={`focus-chip focus-${t.status}`}>
                        {t.name}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </section>

          {focus && (
            <section className="mocks-card focus-card">
              <div className="mocks-card-head">
                <h2>Focus Suggestion</h2>
                <span className="mocks-card-meta">last {focus.sampleSize} mock{focus.sampleSize > 1 ? "s" : ""}</span>
              </div>
              <p className="focus-line">
                Your weakest axis is <strong>{focus.axis}</strong> (avg {focus.avg}%). Prioritize these topics:
              </p>
              {focus.related.length === 0 ? (
                <p className="mocks-empty">No matching roadmap topics found.</p>
              ) : (
                <div className="focus-chips">
                  {focus.related.map((t) => (
                    <Link key={t._id} to={`/topics/${t._id}`} className={`focus-chip focus-${t.status}`}>
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="mocks-card">
            <div className="mocks-card-head">
              <h2>Per-Topic Performance</h2>
            </div>
            {topicStats.length === 0 ? (
              <p className="mocks-empty">No mini-checks recorded yet — record one to build per-topic signals.</p>
            ) : (
              <div className="topic-table-wrap">
                <table className="topic-table">
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Times Tested</th>
                      <th>Success Rate</th>
                      <th>Last Tested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicStats.map((t) => {
                      const rate = Math.round((t.correct / t.timesTested) * 100);
                      return (
                        <tr key={t.name}>
                          <td>{t.name}</td>
                          <td>{t.timesTested}</td>
                          <td>
                            <span className={`rate ${rate < 50 ? "rate-low" : rate < 75 ? "rate-mid" : "rate-high"}`}>
                              {rate}%
                            </span>
                          </td>
                          <td>{formatDate(t.lastTested)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mocks-card">
            <div className="mocks-card-head">
              <h2>Recent Mini-checks</h2>
            </div>
            {miniChecks.length === 0 ? (
              <p className="mocks-empty">No mini-checks recorded yet.</p>
            ) : (
              <div className="minicheck-list">
                {[...miniChecks]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((mc) => {
                    const total = mc.items?.length || 0;
                    const correct = (mc.items || []).filter((i) => i.correct).length;
                    return (
                      <div key={mc._id} className="minicheck-row">
                        <div className="minicheck-head">
                          <span className="minicheck-date">{formatDate(mc.date)}</span>
                          <span className="minicheck-score">
                            {correct}/{total}
                          </span>
                        </div>
                        {total > 0 && (
                          <div className="minicheck-items">
                            {mc.items.map((it, i) => (
                              <span key={i} className={`minicheck-chip ${it.correct ? "ok" : "bad"}`}>
                                {it.correct ? "✓" : "✗"} {it.topicName || "General"}
                                <span className="minicheck-kind">{it.kind}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {mc.notes && <p className="minicheck-notes">{mc.notes}</p>}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </>
      )}

      <Modal isOpen={showRecord} onClose={() => setShowRecord(false)} title="Record Mock Result">
        <RecordForm
          topics={topics}
          onDone={() => setShowRecord(false)}
          onSaved={() => {
            setShowRecord(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div className={`feedback-col feedback-${tone}`}>
      <span className="feedback-title">{title}</span>
      <ul>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function RecordForm({ topics, onDone, onSaved }: { topics: Topic[]; onDone: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<"mini" | "full">("mini");
  const [date, setDate] = useState(todayInput());
  const [topicName, setTopicName] = useState("");
  const [problems, setProblems] = useState(0);
  const [definitions, setDefinitions] = useState(0);
  const [scores, setScores] = useState<FullMockScores>({ dsa: 0, concepts: 0, complexity: 0, architecture: 0 });
  const [strengths, setStrengths] = useState("");
  const [gaps, setGaps] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [notes, setNotes] = useState("");
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function toggleTopic(id: string) {
    setTopicIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (mode === "mini") {
        const items = [
          ...Array.from({ length: 2 }, (_, i) => ({
            topicName: topicName || undefined,
            kind: "problem" as const,
            correct: i < problems,
          })),
          ...Array.from({ length: 3 }, (_, i) => ({
            topicName: topicName || undefined,
            kind: "definition" as const,
            correct: i < definitions,
          })),
        ];
        await apiFetch("/mocks/mini", {
          method: "POST",
          body: JSON.stringify({ date: new Date(date).toISOString(), items, notes: notes.trim() || undefined }),
        });
      } else {
        await apiFetch("/mocks/full", {
          method: "POST",
          body: JSON.stringify({
            date: new Date(date).toISOString(),
            scores,
            feedback: { strengths: lines(strengths), gaps: lines(gaps), actionItems: lines(actionItems) },
            topicIds,
          }),
        });
      }
      onSaved();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to save result");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="record-form" onSubmit={submit}>
      <div className="record-toggle">
        <button type="button" className={mode === "mini" ? "active" : ""} onClick={() => setMode("mini")}>
          Mini-check (20m)
        </button>
        <button type="button" className={mode === "full" ? "active" : ""} onClick={() => setMode("full")}>
          Full Mock (90m)
        </button>
      </div>

      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {mode === "mini" ? (
        <>
          <div className="field">
            <label>Topic (optional)</label>
            <input
              type="text"
              placeholder="e.g. Trees"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Problems Solved Unaided (0–2)</label>
              <input
                type="number"
                min={0}
                max={2}
                value={problems}
                onChange={(e) => setProblems(Math.max(0, Math.min(2, Number(e.target.value))))}
              />
            </div>
            <div className="field">
              <label>Definitions Correct (0–3)</label>
              <input
                type="number"
                min={0}
                max={3}
                value={definitions}
                onChange={(e) => setDefinitions(Math.max(0, Math.min(3, Number(e.target.value))))}
              />
            </div>
          </div>
          <div className="field">
            <label>Notes (optional)</label>
            <textarea
              rows={3}
              placeholder="What held, what didn't, and why"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="field-grid">
          {SCORE_KEYS.map((key) => (
            <div className="field" key={key}>
              <label>{SCORE_LABELS[key]} Score (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={scores[key]}
                onChange={(e) =>
                  setScores((s) => ({ ...s, [key]: Math.max(0, Math.min(100, Number(e.target.value))) }))
                }
              />
            </div>
          ))}
        </div>
      )}

      {mode === "full" && (
        <div className="feedback-fields">
          <label className="field">
            <span>Strengths (one per line)</span>
            <textarea rows={2} value={strengths} onChange={(e) => setStrengths(e.target.value)} />
          </label>
          <label className="field">
            <span>Gaps (one per line)</span>
            <textarea rows={2} value={gaps} onChange={(e) => setGaps(e.target.value)} />
          </label>
          <label className="field">
            <span>Action items (one per line)</span>
            <textarea rows={2} value={actionItems} onChange={(e) => setActionItems(e.target.value)} />
          </label>

          <div className="field">
            <span className="record-topics-label">
              Topics exercised {topicIds.length > 0 && <em>({topicIds.length} selected)</em>}
            </span>
            <input
              type="text"
              placeholder="Filter topics…"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            />
            <div className="record-topic-picker">
              {topics
                .filter((t) => t.name.toLowerCase().includes(topicFilter.toLowerCase()))
                .slice(0, 40)
                .map((t) => {
                  const on = topicIds.includes(t._id);
                  return (
                    <label key={t._id} className={`record-topic-opt ${on ? "on" : ""}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleTopic(t._id)} />
                      <span>{t.name}</span>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {err && <p className="record-error">{err}</p>}

      <div className="record-actions">
        <button type="button" className="record-cancel" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="record-save" disabled={saving}>
          {saving ? "Saving..." : "Save Result"}
        </button>
      </div>
    </form>
  );
}

export default Mocks;
