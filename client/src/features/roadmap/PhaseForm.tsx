import { useState } from "react";
import "./PhaseForm.css";

interface PhaseFormValues {
  name: string;
  startDate: string;
  endDate: string;
  topics: string[];
}

interface PhaseFormProps {
  addPhase: (values: PhaseFormValues) => Promise<void>;
  onDone?: () => void;
}

export default function PhaseForm({ addPhase, onDone }: PhaseFormProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [topicsText, setTopicsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const topics = topicsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await addPhase({ name: name.trim(), startDate, endDate, topics });
      onDone?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="phase-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Phase Name</label>
        <input
          type="text"
          placeholder="e.g. Phase 3: System Design"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Topics to Add</label>
        <textarea
          rows={3}
          placeholder="Caching, Sharding, Load Balancing"
          value={topicsText}
          onChange={(e) => setTopicsText(e.target.value)}
        />
        <span className="field-hint">Comma-separated. Optional.</span>
      </div>

      <button type="submit" className="phase-submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create Phase"}
      </button>
    </form>
  );
}
