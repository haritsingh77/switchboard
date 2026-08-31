import type { Job } from "../../types";
import "./JobItem.css";

interface JobItemProps {
  job: Job;
  deleteJob: (id: string) => void;
}

export default function JobItem({ job, deleteJob }: JobItemProps) {
  return (
    <div className="job-item">
      <h3 className="job-item-title">{job.title}</h3>
      <div className="job-item-row">
        <strong>Status</strong>
        <span className={`status-badge status-${job.status}`}>
          {job.status}
        </span>
      </div>
      <div className="job-item-row">
        <strong>Applied Date</strong>
        <span>{job.appliedDate}</span>
      </div>
      <div className="job-item-row">
        <strong>Package</strong>
        <span>{job.package} LPA</span>
      </div>
      <div className="job-item-row">
        <strong>City</strong>
        <span>{job.city}</span>
      </div>
      <button className="delete-btn" onClick={() => deleteJob(job._id)}>
        Delete
      </button>
    </div>
  );
}
