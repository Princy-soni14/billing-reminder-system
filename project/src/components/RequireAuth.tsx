import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type RequireAuthProps = {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "user")[];
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  // Wait until Firebase + Firestore both finish loading
  if (loading || (user && !role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // If user not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // If role not allowed → block
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-semibold">
          ❌ Access Denied: You don’t have permission to view this page.
        </p>
      </div>
    );
  }

  // Otherwise → show the page
  return <>{children}</>;
};

export default RequireAuth;
