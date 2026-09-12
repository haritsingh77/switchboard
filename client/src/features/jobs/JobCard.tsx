import { useNavigate } from "react-router-dom";
import type { Job } from "../../types";
import "./JobCard.css";

interface JobCardProps {
  job: Job;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  deleteJob: (id: string) => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
}

export default function JobCard({ job, dragging, onDragStart, onDragEnd, deleteJob }: JobCardProps) {
  const navigate = useNavigate();
  const location = [job.company, job.city].filter(Boolean).join(" · ");
  const roundCount = job.rounds?.length || 0;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", job._id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart(job._id);
  }

  return (
    <div
      className={`job-item${dragging ? " job-item-dragging" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/jobs/${job._id}`)}
    >
      <div className="job-item-head">
        <h3 className="job-item-title">{job.title}</h3>
        <button
          className="job-item-remove"
          aria-label="Delete application"
          onClick={(e) => {
            e.stopPropagation();
            deleteJob(job._id);
          }}
        >
          ×
        </button>
      </div>
      {location && <p className="job-item-sub">{location}</p>}
      <div className="job-item-foot">
        {job.package != null && job.package > 0 && <span className="job-item-package">{job.package} LPA</span>}
        {job.appliedDate && <span className="job-item-date">{formatDate(job.appliedDate)}</span>}
      </div>
      {(job.needsTailoredResume || roundCount > 0) && (
        <div className="job-item-tags">
          {roundCount > 0 && <span className="job-item-rounds">{roundCount} round{roundCount > 1 ? "s" : ""}</span>}
          {job.needsTailoredResume && <span className="job-item-flag">Needs tailored resume</span>}
        </div>
      )}
    </div>
  );
}
