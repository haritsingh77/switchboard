import { useMemo, useState } from "react";
import type { Job } from "../../types";
import JobColumn from "./JobColumn";
import "./JobBoard.css";

interface JobBoardProps {
  jobs: Job[];
  deleteJob: (id: string) => void;
  updateJobStatus: (id: string, status: Job["status"]) => void;
}

const COLUMNS: { title: string; status: Job["status"] }[] = [
  { title: "Applied", status: "applied" },
  { title: "Interviewing", status: "interviewing" },
  { title: "Offer", status: "offer" },
  { title: "Rejected", status: "rejected" },
];

export default function JobBoard({ jobs, deleteJob, updateJobStatus }: JobBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<Job["status"], Job[]> = { applied: [], interviewing: [], offer: [], rejected: [] };
    for (const job of jobs) map[job.status].push(job);
    return map;
  }, [jobs]);

  function handleDropOn(status: Job["status"], id: string) {
    const job = jobs.find((j) => j._id === id);
    if (job && job.status !== status) updateJobStatus(id, status);
    setDraggingId(null);
  }

  return (
    <div className="job-board">
      {COLUMNS.map((col) => (
        <JobColumn
          key={col.status}
          title={col.title}
          status={col.status}
          jobs={grouped[col.status]}
          draggingId={draggingId}
          onDragStart={setDraggingId}
          onDragEnd={() => setDraggingId(null)}
          onDropJob={handleDropOn}
          deleteJob={deleteJob}
        />
      ))}
    </div>
  );
}
