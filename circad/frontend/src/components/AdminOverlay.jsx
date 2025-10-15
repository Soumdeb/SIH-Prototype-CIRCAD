// src/components/AdminOverlay.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, LogOut, Settings, Database, Server, Trash2, Monitor } from "lucide-react";
import toast from "react-hot-toast";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

export default function AdminOverlay({ open, onClose }) {
  const { logout } = useAuth();
  const [loadingAction, setLoadingAction] = useState("");

  if (!open) return null;

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const runAdminTask = async (endpoint, successMsg) => {
    try {
      setLoadingAction(endpoint);
      await axiosClient.post(endpoint);
      toast.success(successMsg);
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setLoadingAction("");
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <motion.div
      onMouseDown={handleBackdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-lg bg-slate-900/95 rounded-2xl border border-slate-700 shadow-2xl p-6"
      >
        {/* Close */}
        <button
          onClick={() => onClose?.()}
          className="absolute right-4 top-4 p-2 rounded-md hover:bg-slate-800/60 transition"
        >
          <X size={18} className="text-slate-200" />
        </button>

        <h2 className="text-xl font-semibold text-center text-slate-100 mb-6">
          Admin Functionalities
        </h2>

        {/* Function Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => runAdminTask("/api/admin/system_status/", "Fetched system status")}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium flex items-center justify-center gap-2"
            disabled={!!loadingAction}
          >
            <Monitor size={18} /> Check System Status
          </button>

          <button
            onClick={() => runAdminTask("/api/admin/clear_db/", "Database cleared")}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium flex items-center justify-center gap-2"
            disabled={!!loadingAction}
          >
            <Database size={18} /> Clear Database
          </button>

          <button
            onClick={() => runAdminTask("/api/admin/clear_uploads/", "Uploads cleared")}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium flex items-center justify-center gap-2"
            disabled={!!loadingAction}
          >
            <Trash2 size={18} /> Clear Uploads
          </button>

          <button
            onClick={() => runAdminTask("/api/admin/restart_services/", "Services restarted")}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium flex items-center justify-center gap-2"
            disabled={!!loadingAction}
          >
            <Server size={18} /> Restart Services
          </button>
        </div>

        {/* Logout */}
        <div className="mt-5 pt-5 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white font-medium flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
