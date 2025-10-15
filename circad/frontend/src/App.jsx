// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

import AppShell from "./layouts/AppShell";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Analysis from "./pages/Analysis";
import Dashboard from "./pages/Dashboard";
import ReportsPage from "./pages/Reports";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import { AnalysisProvider } from "./context/AnalysisContext";

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2600,
          style: {
            background: "rgba(15,23,42,0.92)",
            color: "#e6eef5",
            borderRadius: 10,
            border: "1px solid rgba(6,182,212,0.16)",
            fontSize: "0.95rem",
            boxShadow: "0 6px 30px rgba(2,6,23,0.5)",
            backdropFilter: "blur(6px)",
          },
        }}
      />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <Routes>
            <Route path="*" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Home />} />
              <Route path="upload" element={<Upload />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalysisProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AnalysisProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
