// src/layouts/AppShell.jsx
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Topbar from "../components/Topbar";
import AdminOverlay from "../components/AdminOverlay";

export default function AppShell() {
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 transition-colors duration-500">
      <Topbar onOpenAdmin={() => setAdminOpen(true)} />

      <main className="flex-1 pt-20 pb-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="px-6 md:px-10 lg:px-14"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {adminOpen && (
          <AdminOverlay open={adminOpen} onClose={() => setAdminOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
