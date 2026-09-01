import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import type { Study } from "../../types";
import StudyForm from "./StudyForm";
import StudyItem from "./StudyItem";

function StudyList() {
  const [subjects, setSubject] = useState<Study[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await apiFetch("/study");
        setSubject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Subjects");
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);
  async function addSubject(subjectData: Omit<Study, "_id">) {
    try {
      const created = await apiFetch("/study", {
        method: "POST",
        body: JSON.stringify(subjectData),
      });
      setSubject((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add subject");
    }
  }
  async function deleteSubject(id: string) {
    try {
      await apiFetch(`/study/${id}`, { method: "DELETE" });
      setSubject((prev) => prev.filter((subject) => subject._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete subject");
    }
  }

  if (loading) return <p>Loading subject...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <StudyForm addStudy={addSubject} />
      {subjects.map((subject) => (
        <StudyItem key={subject._id} subject={subject} deleteSubject={deleteSubject} />
      ))}
    </div>
  );
}

export default StudyList;
