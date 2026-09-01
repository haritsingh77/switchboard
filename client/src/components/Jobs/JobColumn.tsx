import type { Job } from "../../types";
import JobCard from "./JobCard";

interface JobColumnProps {
  title: string;
  jobs: Job[];
  deleteJob: (id: string) => void;
  updateJobStatus: (id: string, status: Job["status"]) => void;
}

export default function JobColumn({ title, jobs, deleteJob, updateJobStatus }: JobColumnProps) {
  return (
    <div className="job-column">
      <div className="job-column-header">
        <h3 className="job-column-title">{title}</h3>
        <span className="job-column-count">{jobs.length}</span>
      </div>
      <div className="job-column-body">
        {jobs.length === 0 ? (
          <p className="job-column-empty">No jobs</p>
        ) : (
          jobs.map((job) => (
            <JobCard key={job._id} job={job} deleteJob={deleteJob} updateJobStatus={updateJobStatus} />
          ))
        )}
      </div>
    </div>
  );
}
