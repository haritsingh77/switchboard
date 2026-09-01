import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <div className="sidebar">
      <div className="sidebar-brand">⚡ Switchboard</div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
          Overview
        </NavLink>
        <NavLink to="/jobs" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
          Jobs
        </NavLink>
        <NavLink to="/study" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
          Study
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
