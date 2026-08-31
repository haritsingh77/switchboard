import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../common/Navbar";

export default function MainLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: "1rem" }}>
        <Outlet />
      </div>
    </>
  );
}
