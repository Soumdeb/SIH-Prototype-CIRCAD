import React, { useEffect, useState, useMemo } from "react";
import { fetchAllResults } from "../api/uploadService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

const movingAverage = (arr, windowSize = 3) => {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - windowSize + 1), i + 1);
    return slice.reduce((a, b) => a + (b || 0), 0) / slice.length;
  });
};

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username");

  const loadResults = async () => {
    try {
      const data = await fetchAllResults();
      if (Array.isArray(data)) setResults(data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const healthy = results.filter((r) => r.result_json.status === "Healthy");
  const warning = results.filter((r) => r.result_json.status === "Warning");
  const faulty = results.filter(
    (r) =>
      r.result_json.status === "Faulty" ||
      r.result_json.status === "High Contact Resistance"
  );

  const healthIndex = useMemo(() => {
    if (!results.length) return 0;
    const scoreMap = { Healthy: 2, Warning: 1, Faulty: 0 };
    const total = results.reduce(
      (s, r) => s + (scoreMap[r.result_json.status] || 0),
      0
    );
    return ((total / (results.length * 2)) * 100).toFixed(1);
  }, [results]);

  const trendData = useMemo(() => {
    const arr = results.map((r) => ({
      date: new Date(r.created_at).toLocaleDateString(),
      mean_resistance: r.result_json.mean_resistance,
    }));
    const avg = movingAverage(arr.map((a) => a.mean_resistance), 3);
    return arr.map((a, i) => ({ ...a, avg: avg[i] }));
  }, [results]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-10 text-slate-200">
      <div>
        <h1 className="text-2xl font-bold text-cyan-400">
          Analytics Dashboard
        </h1>
        <p className="text-gray-400 mt-1">Welcome, {username}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-800/60 p-5 rounded-xl text-center">
          <p className="text-gray-400 text-sm mb-1">Healthy</p>
          <p className="text-2xl font-bold text-green-500">{healthy.length}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl text-center">
          <p className="text-gray-400 text-sm mb-1">Warning</p>
          <p className="text-2xl font-bold text-yellow-400">{warning.length}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl text-center">
          <p className="text-gray-400 text-sm mb-1">Faulty</p>
          <p className="text-2xl font-bold text-red-500">{faulty.length}</p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-300">
          Resistance Trend Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#47556944" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                color: "#f8fafc",
                borderRadius: "10px",
              }}
            />
            <Line
              type="monotone"
              dataKey="mean_resistance"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#f87171"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-300">
          Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={[
              { name: "Healthy", count: healthy.length },
              { name: "Warning", count: warning.length },
              { name: "Faulty", count: faulty.length },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#47556944" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                color: "#f8fafc",
                borderRadius: "10px",
              }}
            />
            <Bar dataKey="count">
              <Cell fill="#16a34a" />
              <Cell fill="#eab308" />
              <Cell fill="#dc2626" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
