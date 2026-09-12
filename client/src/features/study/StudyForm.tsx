import { useState } from "react";
import type { Study } from "../../types";
import "./StudyForm.css";

interface StudyFormProps {
  addStudy: (study: Omit<Study, "_id">) => void;
  onDone?: () => void;
}

export default function StudyForm({ addStudy, onDone }: StudyFormProps) {
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(60);
  const [topicsLeft, setTopicsLeft] = useState(1);
  const [status, setStatus] = useState<Study["status"]>("in-progress");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStudy({
      subject,
      duration,
      topicsLeft,
      status,
    });
    setSubject("");
    setDuration(60);
    setTopicsLeft(1);
    setStatus("in-progress");
    onDone?.();
  };

  return (
    <form className="study-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Subject</label>
        <input
          type="text"
          placeholder="e.g. React Basics"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Duration (minutes)</label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 120"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </div>
      <div className="field">
        <label>Topics Left</label>
        <input type="number" min="0" value={topicsLeft} onChange={(e) => setTopicsLeft(Number(e.target.value))} />
      </div>
      <div className="field">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as Study["status"])}>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <button className="submit-btn" type="submit">
        Add Subject
      </button>
    </form>
  );
}
