import type { Job } from "../../types";
import "./JobCard.css";

interface JobCardProps {
  job: Job;
  deleteJob: (id: string) => void;
  updateJobStatus: (id: string, status: Job["status"]) => void;
}

const STATUSES: Job["status"][] = ["applied", "interviewing", "offer", "rejected"];

function formatDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function JobCard({ job, deleteJob, updateJobStatus }: JobCardProps) {
  return (
    <div className="job-item">
      <h3 className="job-item-title">{job.title}</h3>
      {job.company && (
        <div className="job-item-row">
          <strong>Company</strong>
          <span>{job.company}</span>
        </div>
      )}
      {job.appliedDate && (
        <div className="job-item-row">
          <strong>Applied Date</strong>
          <span>{formatDate(job.appliedDate)}</span>
        </div>
      )}
      {job.package != null && (
        <div className="job-item-row">
          <strong>Package</strong>
          <span>{job.package} LPA</span>
        </div>
      )}
      {job.city && (
        <div className="job-item-row">
          <strong>City</strong>
          <span>{job.city}</span>
        </div>
      )}
      <div className="job-card-actions">
        <select
          className="job-card-status"
          value={job.status}
          onChange={(e) => updateJobStatus(job._id, e.target.value as Job["status"])}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button className="delete-btn" onClick={() => deleteJob(job._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
