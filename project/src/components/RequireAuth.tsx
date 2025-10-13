import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type RequireAuthProps = {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "user")[];
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  // While checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // 🚪 If not logged in → send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  
  // 🚪 If role is null (claims not set) → send to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // ❌ If role exists but not allowed → block access
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-semibold">
          ❌ Access Denied: You don’t have permission to view this page.
        </p>
      </div>
    );
  }

  // ✅ Else → render page
  return <>{children}</>;
};

export default RequireAuth;
