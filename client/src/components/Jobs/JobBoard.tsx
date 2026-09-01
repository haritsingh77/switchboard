import { useMemo } from "react";
import type { Job } from "../../types";
import JobColumn from "./JobColumn";
import "./JobBoard.css";

interface JobBoardProps {
  jobs: Job[];
  deleteJob: (id: string) => void;
  updateJobStatus: (id: string, status: Job["status"]) => void;
}

export default function Jobboard({ jobs, deleteJob, updateJobStatus }: JobBoardProps) {
  const grouped = useMemo(() => {
    return {
      applied: jobs.filter((j) => j.status === "applied"),
      interviewing: jobs.filter((j) => j.status === "interviewing"),
      offer: jobs.filter((j) => j.status === "offer"),
      rejected: jobs.filter((j) => j.status === "rejected"),
    };
  }, [jobs]);

  return (
    <div className="job-board">
      <JobColumn title="Applied" jobs={grouped.applied} deleteJob={deleteJob} updateJobStatus={updateJobStatus} />
      <JobColumn
        title="Interviewing"
        jobs={grouped.interviewing}
        deleteJob={deleteJob}
        updateJobStatus={updateJobStatus}
      />
      <JobColumn title="Offer" jobs={grouped.offer} deleteJob={deleteJob} updateJobStatus={updateJobStatus} />
      <JobColumn title="Rejected" jobs={grouped.rejected} deleteJob={deleteJob} updateJobStatus={updateJobStatus} />
    </div>
  );
}
