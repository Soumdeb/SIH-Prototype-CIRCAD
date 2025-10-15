// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cyan-600 tracking-wide">
          CIRCAD<span className="text-slate-800 font-light ml-1">Dashboard</span>
        </h1>

        <div className="flex items-center gap-6">
          <Link to="/upload" className="text-gray-700 hover:text-cyan-600 font-medium">
            Upload
          </Link>
          <Link to="/analysis" className="text-gray-700 hover:text-cyan-600 font-medium">
            Analysis
          </Link>
          <Link to="/dashboard" className="text-gray-700 hover:text-cyan-600 font-medium">
            Dashboard
          </Link>

          <div className="flex items-center gap-3 border-l pl-4 border-gray-300">
            <span className="text-gray-600 text-sm">{username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
