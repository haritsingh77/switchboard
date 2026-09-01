import { useState } from "react";
import type { Job } from "../../types";
import "./JobForm.css";

interface JobFormProps {
  addJob: (job: Omit<Job, "_id">) => void;
}

export default function JobForm({ addJob }: JobFormProps) {
  const [title, setTitle] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [status, setStatus] = useState<Job["status"]>("applied");
  const [packageAmount, setPackageAmount] = useState(0);
  const [city, setCity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addJob({
      title,
      appliedDate,
      status,
      package: Number(packageAmount),
      city,
    });
    setTitle("");
    setAppliedDate("");
    setStatus("applied");
    setPackageAmount(0);
    setCity("");
  };

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <h2 className="job-form-title">Add a Job Application</h2>

      {/*Title*/}
      <div className="field">
        <label>Job Title</label>
        <input
          type="text"
          placeholder="e.g. Frontend Developer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/*Applied Date*/}
      <div className="field">
        <label>Applied Date</label>
        <input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
      </div>

      {/*Status*/}
      <div className="field">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as Job["status"])}>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/*Package Amount*/}
      <div className="field">
        <label>Package (LPA)</label>
        <input type="number" value={packageAmount} onChange={(e) => setPackageAmount(Number(e.target.value))} />
      </div>

      {/*City*/}
      <div className="field">
        <label>City</label>
        <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <button type="submit" className="submit-btn">
        Add Job
      </button>
    </form>
  );
}
