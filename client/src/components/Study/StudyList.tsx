import type { Study } from "../../types";
import StudyForm from "./StudyForm";
import StudyItem from "./StudyItem";

interface StudyListProps {
  studies: Study[];
  addStudy: (study: Study) => void;
  deleteStudy: (id: number) => void;
}

function StudyList({ studies, addStudy, deleteStudy }: StudyListProps) {
  return (
    <div>
      <StudyForm addStudy={addStudy} />
      {studies.map((study) => (
        <StudyItem key={study.id} study={study} onDelete={deleteStudy} />
      ))}
    </div>
  );
}

export default StudyList;