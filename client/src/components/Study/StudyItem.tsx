import type { Study } from "../../types";
import "./StudyItem.css";

interface StudyItemProps {
  subject: Study;
  deleteSubject: (id: string) => void;
}

export default function StudyItem({ subject, deleteSubject }: StudyItemProps) {
  return (
    <div className="study-item">
      <h3 className="study-item-title">{subject.subject}</h3>
      <div className="study-item-row">
        <strong>Duration</strong>
        <span>{subject.duration}</span>
      </div>
      <div className="study-item-row">
        <strong>Topics left</strong>
        <span>{subject.topicsLeft}</span>
      </div>
      <div className="study-item-row">
        <strong>Status:</strong>
        <span className={`study-status-badge study-status-${subject.status}`}>{subject.status}</span>
      </div>
      <button className="delete-btn" onClick={() => deleteSubject(subject._id)}>
        Delete
      </button>
    </div>
  );
}
