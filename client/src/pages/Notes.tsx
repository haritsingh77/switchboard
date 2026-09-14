import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api";
import type { Session } from "../types";
import "./Notes.css";

const TRACK_LABELS: Record<Session["track"], string> = { dsa: "DSA", build: "Build", other: "Other" };

function formatDate(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function hasNotes(session: Session) {
  return typeof session.notes === "string" && session.notes.trim().length > 0;
}

function Notes() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Pull every session ever, then keep only the ones carrying notes.
        const from = new Date(0).toISOString();
        const to = new Date("2100-01-01").toISOString();
        const data = (await apiFetch(`/sessions?from=${from}&to=${to}`)) as Session[];
        setSessions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const noted = useMemo(() => {
    const withNotes = sessions.filter(hasNotes);
    // Newest first — the most recent points sit at the top.
    withNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const q = query.trim().toLowerCase();
    if (!q) return withNotes;
    return withNotes.filter((s) => {
      const inNotes = s.notes!.toLowerCase().includes(q);
      const inTopics = s.topics.some((t) => t.name.toLowerCase().includes(q));
      return inNotes || inTopics;
    });
  }, [sessions, query]);

  const totalWithNotes = useMemo(() => sessions.filter(hasNotes).length, [sessions]);

  return (
    <div className="notes">
      <div className="notes-header">
        <div>
          <h1>Session Notes</h1>
          <p className="notes-subtitle">
            Every note you've captured across planner sessions, newest first.
          </p>
        </div>
        {totalWithNotes > 0 && (
          <input
            className="notes-search"
            type="search"
            value={query}
            placeholder="Search notes or topics…"
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
      </div>

      {loading && <p className="notes-msg">Loading notes...</p>}
      {error && !loading && <p className="notes-msg">{error}</p>}

      {!loading && !error && totalWithNotes === 0 && (
        <p className="notes-empty">
          No notes yet. Open a session in the Planner and jot down the important points — they'll all collect here.
        </p>
      )}

      {!loading && !error && totalWithNotes > 0 && noted.length === 0 && (
        <p className="notes-empty">No notes match "{query}".</p>
      )}

      {!loading && !error && noted.length > 0 && (
        <div className="notes-list">
          {noted.map((session) => (
            <article key={session._id} className="note-card">
              <div className="note-card-head">
                <span className="note-date">{formatDate(session.date)}</span>
                <span className="note-meta">
                  {session.slot.toUpperCase()} · {TRACK_LABELS[session.track]}
                </span>
              </div>
              {session.topics.length > 0 && (
                <div className="note-topics">
                  {session.topics.map((t, i) => (
                    <span key={i} className={`note-topic${t.completed ? " done" : ""}`}>
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="note-body">{session.notes}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notes;
