import type { Job } from "../../types";
import JobForm from "./JobForm";
import JobItem from "./JobItem";
interface JobListProps {
  addJob: (job: Job) => void;
  jobs: Job[];
  deleteJob: (id: number) => void;
}

function JobList({ addJob, jobs, deleteJob }: JobListProps) {
  return (
    <div>
      <JobForm addJob={addJob} />
      {jobs.map((job) => (
        <JobItem key={job.id} job={job} deleteJob={deleteJob} />
      ))}
    </div>
  );
}

export default JobList;
