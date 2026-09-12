import { useState } from "react";
import type { Job } from "../../types";
import "./JobForm.css";

interface JobFormProps {
  addJob: (job: Omit<Job, "_id">) => void;
  onDone?: () => void;
}

export default function JobForm({ addJob, onDone }: JobFormProps) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [status, setStatus] = useState<Job["status"]>("applied");
  const [packageAmount, setPackageAmount] = useState("");
  const [city, setCity] = useState("");
  const [needsTailoredResume, setNeedsTailoredResume] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addJob({
      title,
      company,
      appliedDate,
      status,
      package: Number(packageAmount) || 0,
      city,
      needsTailoredResume,
    });
    onDone?.();
  };

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Job Title</label>
        <input
          type="text"
          placeholder="e.g. Frontend Developer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label>Company</label>
        <input
          type="text"
          placeholder="e.g. Acme Corp"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Package (LPA)</label>
          <input
            type="number"
            min={0}
            placeholder="e.g. 24"
            value={packageAmount}
            onChange={(e) => setPackageAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label>City</label>
          <input type="text" placeholder="e.g. Bengaluru" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Applied Date</label>
          <input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Job["status"])}>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <label className="job-form-toggle">
        <input
          type="checkbox"
          checked={needsTailoredResume}
          onChange={(e) => setNeedsTailoredResume(e.target.checked)}
        />
        <span>Needs tailored resume?</span>
      </label>

      <button type="submit" className="submit-btn">
        Add Application
      </button>
    </form>
  );
}
