import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navBar">
      <div className="navbar-brand">⚡ Switchboard</div>
      <div className="navbar-links">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          OverView
        </NavLink>
        <NavLink
          to="/jobs"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Jobs
        </NavLink>
        <NavLink
          to="/study"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Studies
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
