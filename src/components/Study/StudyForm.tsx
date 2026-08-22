import { useState } from "react";
import type { Study } from "../../types";

interface StudyFormProps {
  addStudy: (study: Study) => void;
}

export default function StudyForm({ addStudy }: StudyFormProps) {
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(0);
  const [topicsLeft, setTopicsLeft] = useState(0);
  const [status, setStatus] = useState<Study["status"]>("not-started");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStudy({
      id: Date.now(),
      subject,
      duration,
      topicsLeft,
      status,
    });
    setSubject("");
    setDuration(0);
    setTopicsLeft(0);
    setStatus("not-started");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Study Material</h2>
      <div>
        <label>Subject</label>
        <input
          type="text"
          placeholder="e.g. React Basics"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <label>Duration</label>
        <input
          type="number"
          placeholder="e.g. 2 hours"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Topics Left</label>
        <input
          type="number"
          min="0"
          value={topicsLeft}
          onChange={(e) => setTopicsLeft(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Study["status"])}
        >
          <option value="not-started">Not Started</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <button type="submit">Add Study</button>
    </form>
  );
}
