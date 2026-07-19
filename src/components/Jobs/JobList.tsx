import type { Job } from "../../types";
import JobForm from "./JobForm";

interface JobListProps {
  addJob: (job: Job) => void;
}

function JobList({ addJob }: JobListProps) {
  return (
    <div>
      <JobForm addJob={addJob} />
    </div>
  );
}

export default JobList;
