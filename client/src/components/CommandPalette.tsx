import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import type { Topic, Job } from "../types";
import "./CommandPalette.css";

interface Item {
  id: string;
  label: string;
  kind: "Page" | "Topic" | "Job";
  path: string;
}

const PAGES: Item[] = [
  { id: "p-dash", label: "Dashboard", kind: "Page", path: "/" },
  { id: "p-road", label: "Roadmap", kind: "Page", path: "/roadmap" },
  { id: "p-plan", label: "Planner", kind: "Page", path: "/planner" },
  { id: "p-revise", label: "Revise", kind: "Page", path: "/revise" },
  { id: "p-jobs", label: "Jobs", kind: "Page", path: "/jobs" },
  { id: "p-study", label: "Study", kind: "Page", path: "/study" },
  { id: "p-mocks", label: "Mocks", kind: "Page", path: "/mocks" },
  { id: "p-reviews", label: "Reviews", kind: "Page", path: "/reviews" },
  { id: "p-settings", label: "Settings", kind: "Page", path: "/settings" },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [data, setData] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    if (loaded) return;
    try {
      const [topics, jobs] = await Promise.all([apiFetch("/topics"), apiFetch("/jobs")]);
      const items: Item[] = [
        ...(topics as Topic[]).map((t) => ({ id: `t-${t._id}`, label: t.name, kind: "Topic" as const, path: `/topics/${t._id}` })),
        ...(jobs as Job[]).map((j) => ({
          id: `j-${j._id}`,
          label: `${j.title} · ${j.company}`,
          kind: "Job" as const,
          path: `/jobs/${j._id}`,
        })),
      ];
      setData(items);
      setLoaded(true);
    } catch {
      /* palette is a convenience; ignore load failures */
    }
  }, [loaded]);

  // Global ⌘K / Ctrl-K toggle.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      loadData();
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open, loadData]);

  const results = useMemo(() => {
    const all = [...PAGES, ...data];
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter((i) => i.label.toLowerCase().includes(q)) : PAGES;
    return filtered.slice(0, 24);
  }, [query, data]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(item: Item) {
    setOpen(false);
    navigate(item.path);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="Search topics, jobs, pages…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKey}
        />
        <div className="cmdk-list">
          {results.length === 0 ? (
            <p className="cmdk-empty">No matches.</p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.id}
                className={`cmdk-item ${i === active ? "active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
              >
                <span className="cmdk-label">{item.label}</span>
                <span className="cmdk-kind">{item.kind}</span>
              </button>
            ))
          )}
        </div>
        <div className="cmdk-footer">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
