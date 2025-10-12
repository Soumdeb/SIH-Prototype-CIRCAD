// circad/frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchAllResults } from "../api/uploadService";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, BarChart,
  Bar, PieChart, Pie, Cell,
} from "recharts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected ❌");

  // ---- Helper: Fetch all results ----
  const loadData = async () => {
    try {
      const data = await fetchAllResults();
      setResults(data);
    } catch {
      toast.error("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Initialize WebSocket + live updates ----
  useEffect(() => {
    loadData();

    const ws = new WebSocket("ws://127.0.0.1:8000/ws/updates/");

    ws.onopen = () => {
      setConnectionStatus("⚡ Real-time connection active");
      toast.success("Connected to live updates!", { theme: "colored" });
    };

    ws.onclose = () => {
      setConnectionStatus("Disconnected ❌");
      toast.error("Disconnected from live updates!", { theme: "colored" });
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "analysis_update" && msg.data) {
        const status = msg.data.status;
        const colorMap = {
          Healthy: { theme: "colored", style: { background: "#16a34a" } },
          Warning: { theme: "colored", style: { background: "#eab308" } },
          Faulty: { theme: "colored", style: { background: "#dc2626" } },
        };

        toast.info(
          `✅ ${msg.message} (${status})`,
          colorMap[status] || { theme: "colored" }
        );
        loadData();
      }
    };

    return () => ws.close();
  }, []);

  // ===== Metrics Calculations =====
  const totalFiles = results.length;
  const healthyCount = results.filter((r) => r.result_json.status === "Healthy").length;
  const warningCount = results.filter((r) => r.result_json.status === "Warning").length;
  const faultyCount = results.filter(
    (r) =>
      r.result_json.status === "Faulty" ||
      r.result_json.status === "High Contact Resistance"
  ).length;

  const faultPercentage = totalFiles
    ? ((faultyCount / totalFiles) * 100).toFixed(1)
    : 0;

  const healthIndex = useMemo(() => {
    if (results.length === 0) return 0;
    const scoreMap = { Healthy: 2, Warning: 1, Faulty: 0, "High Contact Resistance": 0 };
    const totalScore = results.reduce(
      (sum, r) => sum + (scoreMap[r.result_json.status] ?? 0),
      0
    );
    return ((totalScore / (results.length * 2)) * 100).toFixed(1);
  }, [results]);

  const lastResult = results[0] || null;

  const trendData = useMemo(() => {
    return results.map((r) => ({
      date: new Date(r.created_at).toLocaleDateString(),
      mean_resistance: r.result_json.mean_resistance,
      status: r.result_json.status,
    }));
  }, [results]);

  const statusDistribution = [
    { name: "Healthy", count: healthyCount },
    { name: "Warning", count: warningCount },
    { name: "Faulty", count: faultyCount },
  ];

  if (loading)
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;

  // === UI START ===
  return (
    <div className="space-y-10 relative p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="absolute top-4 right-6 text-sm font-semibold text-gray-600">
        {connectionStatus}
      </div>

      <h2 className="text-3xl font-bold text-slate-700 mb-6">
        CIRCAD Analytics Dashboard
      </h2>

      {/* Health Gauge + Last Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">
            System Health Index
          </h3>
          <HealthGauge index={healthIndex} />
          <p className="text-gray-600 mt-2 text-sm">
            Overall DCRM condition of recent analyses
          </p>
        </div>

        {lastResult && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Last Analysis Summary
            </h3>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <div>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      lastResult.result_json.status === "Healthy"
                        ? "text-green-600 font-semibold"
                        : lastResult.result_json.status === "Warning"
                        ? "text-yellow-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {lastResult.result_json.status}
                  </span>
                </p>
                <p>
                  <strong>Mean Resistance:</strong>{" "}
                  {lastResult.result_json.mean_resistance} µΩ
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(lastResult.created_at).toLocaleString()}
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <p className="text-gray-700 text-sm">
                  <strong>Trend:</strong>{" "}
                  {lastResult.result_json.mean_resistance > 150
                    ? "Rising Resistance (⚠️)"
                    : "Stable"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Analyses" value={totalFiles} color="bg-cyan-600" />
        <MetricCard title="Healthy Breakers" value={healthyCount} color="bg-green-600" />
        <MetricCard title="Faulty Breakers" value={faultyCount} color="bg-red-600" />
        <MetricCard title="Fault Percentage" value={`${faultPercentage}%`} color="bg-yellow-500" />
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Resistance Trend Over Time
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              label={{
                value: "Mean Resistance (µΩ)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="mean_resistance"
              stroke="#0891b2"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statusDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" barSize={60}>
              <Cell key="Healthy" fill="#16a34a" />
              <Cell key="Warning" fill="#eab308" />
              <Cell key="Faulty" fill="#dc2626" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ===== Reusable Components =====
const MetricCard = ({ title, value, color }) => (
  <div className={`rounded-2xl p-6 text-white shadow-md ${color} transition hover:shadow-lg`}>
    <h4 className="text-sm uppercase tracking-wide opacity-90 mb-1">{title}</h4>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const HealthGauge = ({ index }) => {
  const value = Math.min(100, Math.max(0, Number(index)));
  const data = [
    { name: "Health", value },
    { name: "Remaining", value: 100 - value },
  ];

  const getColor = () => {
    if (value > 80) return "#16a34a";
    if (value > 50) return "#eab308";
    return "#dc2626";
  };

  return (
    <PieChart width={200} height={120}>
      <Pie
        data={data}
        innerRadius={50}
        outerRadius={80}
        startAngle={180}
        endAngle={0}
        paddingAngle={5}
        dataKey="value"
      >
        <Cell fill={getColor()} />
        <Cell fill="#e5e7eb" />
      </Pie>
      <text
        x={100}
        y={90}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={18}
        fill="#374151"
      >
        {Math.round(value)}%
      </text>
    </PieChart>
  );
};

export default Dashboard;
