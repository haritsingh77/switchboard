import type { Study } from "../../types";
import "./StudyItem.css";

interface StudyItemProps {
  study: Study;
  deleteStudy: (id: number) => void;
}

export default function StudyItem({ study, deleteStudy }: StudyItemProps) {
  return (
    <div className="study-item">
      <h3 className="study-item-title">{study.subject}</h3>
      <div className="study-item-row">
        <strong>Duration</strong>
        <span>{study.duration}</span>
      </div>
      <div className="study-item-row">
        <strong>Topics left</strong>
        <span>{study.topicsLeft}</span>
      </div>
      <div className="study-item-row">
        <strong>Status:</strong>
        <span className={`study-status-badge study-status-${study.status}`}>
          {study.status}
        </span>
      </div>
      <button className="delete-btn" onClick={() => deleteStudy(study.id)}>
        Delete
      </button>
    </div>
  );
}
