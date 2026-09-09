import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api";
import type { Roadmap as RoadmapType, Phase, Topic } from "../types";
import Modal from "../components/Modal";
import PhaseForm from "../features/roadmap/PhaseForm";
import "./Roadmap.css";

const DAY = 24 * 60 * 60 * 1000;

async function fetchAll() {
  const [r, p, t] = await Promise.all([apiFetch("/roadmaps"), apiFetch("/phases"), apiFetch("/topics")]);
  return { r: r as RoadmapType[], p: p as Phase[], t: t as Topic[] };
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit", timeZone: "UTC" });
}

interface PhaseView extends Phase {
  completion: number;
  phaseStatus: "done" | "current" | "upcoming";
  topics: Topic[];
}

function Roadmap() {
  const [roadmaps, setRoadmaps] = useState<RoadmapType[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [now] = useState(() => Date.now());

  useEffect(() => {
    async function loadRoadmap() {
      try {
        const { r, p, t } = await fetchAll();
        setRoadmaps(r);
        setPhases(p);
        setTopics(t);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load roadmap");
      } finally {
        setLoading(false);
      }
    }
    loadRoadmap();
  }, []);

  const roadmap = useMemo(() => roadmaps.find((r) => r.isActive) ?? roadmaps[0] ?? null, [roadmaps]);

  const { phaseViews, overallCompletion, weeksElapsed, weeksRemaining } = useMemo(() => {
    if (!roadmap) {
      return { phaseViews: [] as PhaseView[], overallCompletion: 0, weeksElapsed: 0, weeksRemaining: 0 };
    }
    const roadmapTopics = topics.filter((t) => t.roadmapId === roadmap._id);
    const ordered = phases.filter((p) => p.roadmapId === roadmap._id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    let currentAssigned = false;
    const views: PhaseView[] = ordered.map((p) => {
      const phaseTopics = roadmapTopics.filter((t) => t.phaseId === p._id);
      const done = phaseTopics.filter((t) => t.status === "completed").length;
      const completion = phaseTopics.length ? Math.round((done / phaseTopics.length) * 100) : 0;
      let phaseStatus: PhaseView["phaseStatus"];
      if (completion >= 100) {
        phaseStatus = "done";
      } else if (!currentAssigned) {
        phaseStatus = "current";
        currentAssigned = true;
      } else {
        phaseStatus = "upcoming";
      }
      return { ...p, completion, phaseStatus, topics: phaseTopics };
    });

    const doneAll = roadmapTopics.filter((t) => t.status === "completed").length;
    const overall = roadmapTopics.length ? Math.round((doneAll / roadmapTopics.length) * 100) : 0;
    const elapsed = Math.max(0, Math.floor((now - new Date(roadmap.createdAt).getTime()) / (7 * DAY)));
    const remaining = roadmap.targetDate
      ? Math.max(0, Math.ceil((new Date(roadmap.targetDate).getTime() - now) / (7 * DAY)))
      : 0;

    return { phaseViews: views, overallCompletion: overall, weeksElapsed: elapsed, weeksRemaining: remaining };
  }, [roadmap, phases, topics, now]);

  async function addPhase(values: { name: string; startDate: string; endDate: string; topics: string[] }) {
    if (!roadmap) return;
    const created = await apiFetch("/phases", {
      method: "POST",
      body: JSON.stringify({
        roadmapId: roadmap._id,
        name: values.name,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        order: phaseViews.length,
      }),
    });
    await Promise.all(
      values.topics.map((name) =>
        apiFetch("/topics", { method: "POST", body: JSON.stringify({ phaseId: created._id, name }) }),
      ),
    );
    const { r, p, t } = await fetchAll();
    setRoadmaps(r);
    setPhases(p);
    setTopics(t);
  }

  if (loading) return <p className="roadmap-msg">Loading roadmap...</p>;
  if (error) return <p className="roadmap-msg">{error}</p>;

  if (!roadmap) {
    return (
      <div className="roadmap-page">
        <div className="roadmap-header">
          <div>
            <h1>Roadmap</h1>
            <p className="roadmap-subtitle">No active roadmap yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const ring = `conic-gradient(#7c3aed ${overallCompletion * 3.6}deg, #2a2438 0deg)`;

  return (
    <div className="roadmap-page">
      <div className="roadmap-header">
        <div>
          <h1>Roadmap</h1>
          <p className="roadmap-subtitle">
            Target: {roadmap.goal || roadmap.name}
            {roadmap.targetDate ? ` · ${formatDate(roadmap.targetDate)}` : ""}
          </p>
        </div>
        <button className="roadmap-add-btn" onClick={() => setShowAddPhase(true)}>
          + Add Phase
        </button>
      </div>

      <div className="roadmap-card">
        <div className="roadmap-overall">
          <div className="roadmap-ring" style={{ background: ring }}>
            <span>{overallCompletion}%</span>
          </div>
          <div>
            <p className="roadmap-overall-label">Overall Completion</p>
            <p className="roadmap-overall-weeks">
              {weeksElapsed} weeks elapsed, {weeksRemaining} remaining
            </p>
          </div>
        </div>

        <div className="phase-list">
          {phaseViews.length === 0 && <p className="roadmap-msg">No phases yet. Add one to get started.</p>}
          {phaseViews.map((p) => (
            <div
              key={p._id}
              className={`phase-row ${p.phaseStatus === "current" ? "phase-row-current" : ""}`}
              onClick={() => setExpandedId(expandedId === p._id ? null : p._id)}
            >
              <div className="phase-row-main">
                <span className={`phase-badge phase-badge-${p.phaseStatus}`}>
                  {p.phaseStatus === "done" ? "Done" : p.phaseStatus === "current" ? "Current" : "Upcoming"}
                </span>
                <div className="phase-row-info">
                  <span className="phase-name">{p.name}</span>
                  {(p.startDate || p.endDate) && (
                    <span className="phase-dates">
                      {formatDate(p.startDate)} - {formatDate(p.endDate)}
                    </span>
                  )}
                </div>
                <span className="phase-pct">{p.completion}%</span>
                <span className="phase-chevron">{expandedId === p._id ? "▴" : "▾"}</span>
              </div>
              {expandedId === p._id && (
                <div className="phase-topics" onClick={(e) => e.stopPropagation()}>
                  {p.topics.length === 0 && <span className="phase-topics-empty">No topics in this phase.</span>}
                  {p.topics.map((t) => (
                    <span key={t._id} className={`phase-topic phase-topic-${t.status}`}>
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={showAddPhase} onClose={() => setShowAddPhase(false)} title="Add Phase to Roadmap">
        <PhaseForm addPhase={addPhase} onDone={() => setShowAddPhase(false)} />
      </Modal>
    </div>
  );
}

export default Roadmap;
