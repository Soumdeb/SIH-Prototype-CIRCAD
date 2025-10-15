import React, { useEffect, useState } from "react";
import { useSafeAnalysis } from "../hooks/useSafeAnalysis";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";

export default function Analysis() {
  const { analysisData } = useSafeAnalysis();
  const [dataReady, setDataReady] = useState(null);
  const username = localStorage.getItem("username");

  // ✅ Sync context with localStorage fallback
  useEffect(() => {
    if (!analysisData) {
      const cached = localStorage.getItem("lastAnalysis");
      if (cached) setDataReady(JSON.parse(cached));
    } else {
      setDataReady(analysisData);
      localStorage.setItem("lastAnalysis", JSON.stringify(analysisData));
    }
  }, [analysisData]);

  // ✅ Fallback UI if no data found
  if (!dataReady || !dataReady.result_json) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
        <p className="mb-4">
          No analysis data found. Please upload a file first.
        </p>
        <button
          onClick={() => window.dispatchEvent(new Event("openUpload"))}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
        >
          Open Upload Panel
        </button>
      </div>
    );
  }

  // ✅ Destructure analysis data safely
  const { result_json, created_at, id } = dataReady;
  const {
    status,
    mean_resistance,
    std_dev,
    min_resistance,
    max_resistance,
    predicted_condition,
    predicted_confidence,
    forecast_next_mean,
    data_points = [],
  } = result_json;

  // ✅ Prepare data for chart
  const data = data_points.map((p, i) => ({
    time: p.time || `T${i + 1}`,
    resistance: p.resistance,
  }));

  // ✅ Status-based color mapping
  const colorMap = {
    Healthy: "#16a34a",
    Warning: "#eab308",
    Faulty: "#dc2626",
    "High Contact Resistance": "#dc2626",
  };
  const strokeColor = colorMap[status] || "#06b6d4";

  // ✅ Generate and download PDF
  const handlePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CIRCAD DCRM Analysis Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Status: ${status}`, 14, 35);
    doc.text(`Mean Resistance: ${mean_resistance} µΩ`, 14, 45);
    doc.text(`Std. Deviation: ${std_dev} µΩ`, 14, 55);
    doc.text(`Range: ${min_resistance}–${max_resistance} µΩ`, 14, 65);

    if (predicted_condition) {
      doc.text(
        `Prediction: ${predicted_condition} (${Math.round(
          predicted_confidence * 100
        )}%)`,
        14,
        75
      );
    }

    if (forecast_next_mean) {
      doc.text(`Forecast: ${forecast_next_mean} µΩ`, 14, 85);
    }

    doc.text(`Generated: ${new Date(created_at).toLocaleString()}`, 14, 95);
    doc.save(`CIRCAD_Report_${id}.pdf`);
  };

  // ✅ Main UI
  return (
    <div className="space-y-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cyan-400">
          DCRM Analysis ({username})
        </h2>
        <button
          onClick={() => window.dispatchEvent(new Event("openUpload"))}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition"
        >
          ← Back to Upload
        </button>
      </div>

      <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6">
        <div className="flex justify-between text-gray-300">
          <span>Status: {status}</span>
          <span>
            Mean Resistance: <strong>{mean_resistance} µΩ</strong>
          </span>
        </div>

        <ResponsiveContainer width="100%" height={350} className="mt-6">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#47556944" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                color: "#f8fafc",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="resistance"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="text-center mt-6">
          <button
            onClick={handlePDF}
            className="px-5 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition"
          >
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
