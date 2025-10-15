import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Topbar({ onOpenAdmin }) {
  const { theme, toggleTheme } = useTheme();
  const username = localStorage.getItem("username") || "Admin";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/95 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 relative flex items-center">
          {/* Theme toggle */}
          <div className="absolute left-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-800/60 transition"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-yellow-400" />
              ) : (
                <Moon size={18} className="text-slate-200" />
              )}
            </button>
          </div>

          {/* Center title */}
          <div className="mx-auto text-center">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-100">
              CIRCAD
            </h1>
          </div>

          {/* Right user button */}
          <div className="absolute right-4">
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow hover:brightness-95 transition"
            >
              <span className="font-semibold">{username}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
