// src/components/ProtectedRoute.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role) && !user.is_staff) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
