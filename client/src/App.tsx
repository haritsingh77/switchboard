import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./pages/Login";
import SignupForm from "./pages/Signup";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import Planner from "./pages/Planner";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import StudyList from "./pages/Study";
import Mocks from "./pages/Mocks";
import Reviews from "./pages/Reviews";
import TopicDetail from "./pages/TopicDetail";
import Settings from "./pages/Settings";
import Revise from "./pages/Revise";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/study" element={<StudyList />} />
          <Route path="/mocks" element={<Mocks />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/topics/:id" element={<TopicDetail />} />
          <Route path="/revise" element={<Revise />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
