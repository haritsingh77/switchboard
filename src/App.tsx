import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { Job, Study } from "./types";
import Navbar from "./components/common/Navbar";
import Overview from "./components/Overview/Overview";
import JobList from "./components/Jobs/JobList";
import StudyList from "./components/Study/StudyList";

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);

  function addJob(job: Job) {
    setJobs((prev) => [...prev, job]);
  }

  function addStudies(study: Study) {
    setStudies((prev) => [...prev, study]);
  }

  function deleteStudy(id: number) {
    setStudies((prev) => prev.filter((t) => t.id !== id));
  }

  function deleteJob(id: number) {
    setJobs((prev) => prev.filter((t) => t.id != id));
  }

  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ padding: "1rem" }}>
        <Routes>
          <Route
            path="/"
            element={<Overview jobs={jobs} studies={studies} />}
          />
          <Route
            path="/jobs"
            element={
              <JobList addJob={addJob} jobs={jobs} deleteJob={deleteJob} />
            }
          />
          <Route
            path="/study"
            element={
              <StudyList
                studies={studies}
                addStudy={addStudies}
                deleteStudy={deleteStudy}
              />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
