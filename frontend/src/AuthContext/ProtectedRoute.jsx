import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext"; 
// import { useEffect } from "react";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Prevent rendering during loading
  }

  if (!user) {
    alert("You need to sign in first.");
    return <Navigate to="/signin" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // alert("Couldn't find this page.");
    return <Navigate to={user.role === "ADMIN" ? "/admin/projects" : "/projects"} replace />;
  }


  return <Outlet />;
};

export default ProtectedRoute;
