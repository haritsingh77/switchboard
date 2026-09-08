import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./pages/Login";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import StudyList from "./pages/Study";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/study" element={<StudyList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
