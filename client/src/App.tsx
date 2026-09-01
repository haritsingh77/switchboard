import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./components/Auth/Login";
import MainLayout from "./components/layout/MainLayout";
import type { Job, Study } from "./types";
import Overview from "./components/Overview/Overview";
import JobList from "./components/Jobs/JobList";
import StudyList from "./components/Study/StudyList";

function App() {
  const [jobs] = useState<Job[]>([]);
  const [studies] = useState<Study[]>([]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Overview jobs={jobs} studies={studies} />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/study" element={<StudyList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
