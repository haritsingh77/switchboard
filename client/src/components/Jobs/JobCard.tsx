import type { Job } from "../../types";
import "./JobItem.css";

interface JobCardProps {
  job: Job;
  deleteJob: (id: string) => void;
  updateJobStatus: (id: string, status: Job["status"]) => void;
}

const STATUSES: Job["status"][] = ["applied", "interviewing", "offer", "rejected"];

export default function JobCard({ job, deleteJob, updateJobStatus }: JobCardProps) {
  return (
    <div className="job-item">
      <h3 className="job-item-title">{job.title}</h3>
      {job.appliedDate && (
        <div className="job-item-row">
          <strong>Applied Date</strong>
          <span>{job.appliedDate}</span>
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
