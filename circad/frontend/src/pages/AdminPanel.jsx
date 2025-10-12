import React, { useEffect, useState } from "react";
import {
  getSystemStatus, resetAll, resetDBOnly, clearUploads,
  deleteFile, deleteAnalysis
} from "../api/adminService";

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data } = await getSystemStatus();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  const confirmAndRun = async (action, message) => {
    if (window.confirm(message)) {
      setLoading(true);
      try {
        await action();
        alert("✅ Operation successful!");
        fetchStatus();
      } catch {
        alert("❌ Operation failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-3xl font-bold text-gray-700">CIRCAD Admin Console</h2>

      {loading && <p className="text-gray-500">Processing...</p>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard title="Uploaded Files" value={stats.total_files} />
          <StatCard title="Analyses" value={stats.total_analyses} />
          <StatCard title="Healthy" value={stats.healthy} color="green" />
          <StatCard title="Warning" value={stats.warning} color="yellow" />
          <StatCard title="Faulty" value={stats.faulty} color="red" />
          <StatCard title="Storage Used" value={`${stats.storage_used} MB`} />
        </div>
      )}

      <div className="space-x-4 mt-6">
        <button className="btn bg-red-600 text-white" onClick={() =>
          confirmAndRun(resetAll, "Delete ALL data and uploads?")
        }>Full Reset</button>

        <button className="btn bg-yellow-600 text-white" onClick={() =>
          confirmAndRun(resetDBOnly, "Reset database but keep uploads?")
        }>Reset DB Only</button>

        <button className="btn bg-cyan-600 text-white" onClick={() =>
          confirmAndRun(clearUploads, "Clear uploaded files (keep DB)?")
        }>Clear Uploads</button>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Delete Specific Record</h3>
        <div className="flex space-x-4">
          <input id="fileId" type="number" placeholder="File ID" className="border rounded px-3 py-1" />
          <button onClick={() => {
            const id = document.getElementById("fileId").value;
            confirmAndRun(() => deleteFile(id), `Delete File ${id}?`);
          }} className="btn bg-rose-600 text-white">Delete File</button>

          <input id="analysisId" type="number" placeholder="Analysis ID" className="border rounded px-3 py-1" />
          <button onClick={() => {
            const id = document.getElementById("analysisId").value;
            confirmAndRun(() => deleteAnalysis(id), `Delete Analysis ${id}?`);
          }} className="btn bg-amber-600 text-white">Delete Analysis</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color = "slate" }) => (
  <div className={`rounded-xl bg-${color}-100 text-${color}-800 p-4 shadow-sm`}>
    <h4 className="text-sm uppercase opacity-75">{title}</h4>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default AdminPanel;
