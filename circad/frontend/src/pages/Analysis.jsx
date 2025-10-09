import React from "react";
import { useAnalysis } from "../context/AnalysisContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";

export default function Analysis() {
  const { analysisData } = useAnalysis();
  if (!analysisData)
    return <div className="text-gray-500 p-8">No analysis data found. Upload a file first.</div>;

  const { result_json, created_at } = analysisData;
  const { status, mean_resistance, data_points } = result_json;

  const chartData = data_points || [];

  const colorMap = {
    Healthy: "#16a34a",   // Green
    Warning: "#eab308",   // Yellow
    Faulty: "#dc2626"     // Red
  };

  const statusColor =
    status === "Healthy" ? "bg-green-100 text-green-700 border-green-300"
    : status === "Warning" ? "bg-yellow-100 text-yellow-700 border-yellow-300"
    : "bg-red-100 text-red-700 border-red-300";

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CIRCAD DCRM Analysis Report", 14, 20);
    doc.setFontSize(12);

    const res = analysisData.result_json;
    doc.text(`Status: ${res.status}`, 14, 35);
    doc.text(`Mean Resistance: ${res.mean_resistance} µΩ`, 14, 45);
    doc.text(`Std. Deviation: ${res.std_dev} µΩ`, 14, 55);
    doc.text(`Min Resistance: ${res.min_resistance} µΩ`, 14, 65);
    doc.text(`Max Resistance: ${res.max_resistance} µΩ`, 14, 75);
    doc.text(`Created At: ${new Date(analysisData.created_at).toLocaleString()}`, 14, 85);

    doc.save(`CIRCAD_Report_${analysisData.id}.pdf`);
  };

    const handleDownloadCSV = () => {
    const csvContent = [
        ["Time (ms)", "Resistance (µΩ)"],
        ...analysisData.result_json.data_points.map(p => [p.time, p.resistance])
    ]
        .map(e => e.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CIRCAD_Data_${analysisData.id}.csv`);
    link.click();
    };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-700">DCRM Analysis Report</h2>

      {/* Status Card */}
      <div className={`border ${statusColor} p-6 rounded-2xl shadow-sm`}>
        <h3 className="text-xl font-semibold">Status: {status}</h3>
        <p className="text-sm text-gray-600">Created: {new Date(created_at).toLocaleString()}</p>
        <p className="mt-2 text-lg">
          Mean Resistance: <strong>{mean_resistance} µΩ</strong>
        </p>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h4 className="font-semibold mb-4 text-gray-700">Resistance vs Time</h4>
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analysisData?.result_json?.data_points || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                dataKey="time"
                label={{ value: "Time (ms)", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis
                label={{ value: "Resistance (µΩ)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip />
                <Line
                    type="monotone"
                    dataKey="resistance"
                    stroke={colorMap[analysisData?.result_json?.status] || "#2563eb"}
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
            </ResponsiveContainer>
      </div>

      <button
        onClick={handleDownloadPDF}
        style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer"
        }}
        >
        Download PDF Report
      </button>

      <button
        onClick={handleDownloadCSV}
        style={{
            marginLeft: "1rem",
            padding: "0.5rem 1rem",
            border: "none",
            backgroundColor: "#10b981",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer"
        }}
        >
        Export CSV
      </button>

    </div>
  );
}
