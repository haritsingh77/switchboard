import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api";
import type { Study } from "../types";
import StudyForm from "../features/study/StudyForm";
import Modal from "../components/Modal";
import "./Study.css";

const STATUS_LABELS: Record<Study["status"], string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

// The Study model has no explicit performance metric, so completion is derived
// from status to fill the green "progress" bar alongside effort.
const STATUS_COMPLETION: Record<Study["status"], number> = {
  "not-started": 0,
  "in-progress": 50,
  completed: 100,
};

function formatHours(minutes: number) {
  const h = minutes / 60;
  if (h < 1) return `${minutes}m`;
  return `${Math.round(h * 10) / 10}h`;
}

function StudyList() {
  const [subjects, setSubjects] = useState<Study[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await apiFetch("/study");
        setSubjects(data as Study[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subjects");
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  async function addSubject(subjectData: Omit<Study, "_id">) {
    try {
      const created = await apiFetch("/study", {
        method: "POST",
        body: JSON.stringify(subjectData),
      });
      setSubjects((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add subject");
    }
  }

  async function deleteSubject(id: string) {
    if (!window.confirm("Delete this subject? This can't be undone.")) return;
    const prev = subjects;
    setSubjects((cur) => cur.filter((s) => s._id !== id));
    try {
      await apiFetch(`/study/${id}`, { method: "DELETE" });
    } catch (err) {
      setSubjects(prev);
      setError(err instanceof Error ? err.message : "Failed to delete subject");
    }
  }

  const maxEffort = useMemo(() => Math.max(60, ...subjects.map((s) => s.duration || 0)), [subjects]);
  const inProgress = subjects.filter((s) => s.status === "in-progress");

  return (
    <div className="study">
      <div className="study-header">
        <div>
          <h1>Study Tracker</h1>
          <p className="study-subtitle">Effort vs Performance &amp; Spaced Repetition</p>
        </div>
        <button className="study-add-btn" onClick={() => setShowAdd(true)}>
          + Add Subject
        </button>
      </div>

      {error && <p className="study-error">{error}</p>}

      {loading ? (
        <p className="study-msg">Loading subjects...</p>
      ) : subjects.length === 0 ? (
        <p className="study-empty">No subjects yet. Add one to start tracking effort.</p>
      ) : (
        <>
          <section className="study-card">
            <div className="study-card-head">
              <h2>Effort vs Progress</h2>
              <div className="study-legend">
                <span className="legend-item">
                  <span className="legend-dot legend-effort" /> Effort (hrs)
                </span>
                <span className="legend-item">
                  <span className="legend-dot legend-progress" /> Completion
                </span>
              </div>
            </div>
            <div className="effort-chart">
              {subjects.map((s) => (
                <div key={s._id} className="effort-row">
                  <span className="effort-name">{s.subject}</span>
                  <div className="effort-bars">
                    <div className="effort-bar-track">
                      <div
                        className="effort-bar effort-bar-effort"
                        style={{ width: `${Math.round(((s.duration || 0) / maxEffort) * 100)}%` }}
                      />
                      <span className="effort-bar-val">{formatHours(s.duration || 0)}</span>
                    </div>
                    <div className="effort-bar-track">
                      <div
                        className="effort-bar effort-bar-progress"
                        style={{ width: `${STATUS_COMPLETION[s.status]}%` }}
                      />
                      <span className="effort-bar-val">{STATUS_COMPLETION[s.status]}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="study-card">
            <div className="study-card-head">
              <h2>In Progress ({inProgress.length})</h2>
            </div>
            {inProgress.length === 0 ? (
              <p className="study-empty">Nothing in progress right now.</p>
            ) : (
              <div className="subject-grid">
                {inProgress.map((s) => (
                  <div key={s._id} className="subject-card">
                    <div className="subject-card-head">
                      <span className="subject-name">{s.subject}</span>
                      <button
                        className="subject-remove"
                        aria-label="Delete subject"
                        onClick={() => deleteSubject(s._id)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="subject-meta">
                      <span>{s.duration} min studied</span>
                      <span>{s.topicsLeft} topics left</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="study-card">
            <div className="study-card-head">
              <h2>All Subjects</h2>
            </div>
            <div className="subject-grid">
              {subjects.map((s) => (
                <div key={s._id} className="subject-card">
                  <div className="subject-card-head">
                    <span className="subject-name">{s.subject}</span>
                    <button
                      className="subject-remove"
                      aria-label="Delete subject"
                      onClick={() => deleteSubject(s._id)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="subject-meta">
                    <span>{formatHours(s.duration || 0)} studied</span>
                    <span>{s.topicsLeft} topics left</span>
                  </div>
                  <span className={`subject-status subject-status-${s.status}`}>{STATUS_LABELS[s.status]}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Subject">
        <StudyForm addStudy={addSubject} onDone={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}

export default StudyList;
