import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import "./Settings.css";

interface ExportPayload {
  exportedAt: string;
  user: { email: string } | null;
  collections: Record<string, Record<string, unknown>[]>;
}

const COLLECTION_LABELS: Record<string, string> = {
  roadmaps: "Roadmaps",
  phases: "Phases",
  topics: "Topics",
  sessions: "Sessions",
  miniChecks: "Mini-checks",
  fullMocks: "Full mocks",
  reviews: "Weekly reviews",
  jobs: "Jobs",
  study: "Study subjects",
};

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function Settings() {
  const [data, setData] = useState<ExportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const payload = (await apiFetch("/export")) as ExportPayload;
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load export data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function downloadJSON() {
    if (!data) return;
    download(`switchboard-export-${stamp()}.json`, JSON.stringify(data, null, 2), "application/json");
  }

  function downloadCSV(name: string) {
    if (!data) return;
    const rows = data.collections[name] || [];
    download(`switchboard-${name}-${stamp()}.csv`, toCSV(rows), "text/csv");
  }

  const collections = data ? Object.keys(COLLECTION_LABELS).filter((k) => k in data.collections) : [];
  const totalRows = data
    ? Object.values(data.collections).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-subtitle">Your account and data</p>
      </div>

      {loading && <p className="settings-msg">Loading...</p>}
      {error && !loading && <p className="settings-msg">{error}</p>}

      {data && (
        <section className="settings-card">
          <div className="settings-card-head">
            <div>
              <h2>Data Export</h2>
              <p className="settings-card-sub">
                {totalRows} records{data.user ? ` · ${data.user.email}` : ""}. Download a full backup anytime.
              </p>
            </div>
            <button className="settings-primary" onClick={downloadJSON}>
              Download all (JSON)
            </button>
          </div>

          <div className="export-list">
            {collections.map((key) => {
              const count = data.collections[key].length;
              return (
                <div key={key} className="export-row">
                  <span className="export-name">{COLLECTION_LABELS[key]}</span>
                  <span className="export-count">{count}</span>
                  <button
                    className="export-csv-btn"
                    disabled={count === 0}
                    onClick={() => downloadCSV(key)}
                  >
                    CSV
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default Settings;
