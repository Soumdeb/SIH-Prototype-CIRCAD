import React from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Topbar() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Theme toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>

        {/* Center: Product name */}
        <div className="text-center select-none">
          <h1 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 tracking-wide">
            CIRCAD
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Condition & Resistance Analytics Dashboard
          </p>
        </div>

        {/* Right: Admin panel */}
        <button
          onClick={() => navigate("/admin")}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          Admin Panel
        </button>
      </div>
    </header>
  );
}
