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

  function deleteJob(id: number) {
    setJobs((prev) => prev.filter((t) => t.id !== id));
  }
  function addStudies(study: Study) {
    setStudies((prev) => [...prev, study]);
  }

  function deleteStudies(id: number) {
    setStudies((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/study" element={<StudyList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
