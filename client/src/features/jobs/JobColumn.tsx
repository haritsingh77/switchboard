import { useState } from "react";
import type { Job } from "../../types";
import JobCard from "./JobCard";

interface JobColumnProps {
  title: string;
  status: Job["status"];
  jobs: Job[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropJob: (status: Job["status"], id: string) => void;
  deleteJob: (id: string) => void;
}

export default function JobColumn({
  title,
  status,
  jobs,
  draggingId,
  onDragStart,
  onDragEnd,
  onDropJob,
  deleteJob,
}: JobColumnProps) {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isOver) setIsOver(true);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    const id = e.dataTransfer.getData("text/plain");
    if (id) onDropJob(status, id);
  }

  const dragging = draggingId !== null;

  return (
    <div
      className={`job-column${isOver ? " job-column-over" : ""}${dragging ? " job-column-active" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <div className="job-column-header">
        <h3 className={`job-column-title ${status}`}>{title}</h3>
        <span className="job-column-count">{jobs.length}</span>
      </div>
      <div className="job-column-body">
        {jobs.length === 0 ? (
          <p className="job-column-empty">{isOver ? "Drop here" : "No applications"}</p>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              dragging={draggingId === job._id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              deleteJob={deleteJob}
            />
          ))
        )}
      </div>
    </div>
  );
}
