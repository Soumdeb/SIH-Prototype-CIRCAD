import React from "react";
import { useAnalysis } from "../context/AnalysisContext";
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
  const { analysisData } = useAnalysis();

  if (!analysisData)
    return (
      <div className="text-gray-500 p-8">
        No analysis data found. Upload a file first.
      </div>
    );

  const { result_json, created_at, id } = analysisData;
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

  // ======== Chart data construction with forecast ========
  const data = data_points.map((p) => ({
    time: p.time,
    resistance: p.resistance,
  }));

  if (forecast_next_mean !== null && forecast_next_mean !== undefined) {
    const lastTime = data.length ? data[data.length - 1].time : 0;
    const delta =
      data.length > 1
        ? data[data.length - 1].time - data[data.length - 2].time
        : 1;
    data.push({
      time: lastTime + delta,
      resistance: null, // break actual line
      forecast: forecast_next_mean,
    });
  }

  // ======== Color maps ========
  const colorMap = {
    Healthy: "#16a34a",
    Warning: "#eab308",
    Faulty: "#dc2626",
  };
  const strokeColor = colorMap[status] || "#2563eb";

  const statusColor =
    status === "Healthy"
      ? "bg-green-100 text-green-700 border-green-300"
      : status === "Warning"
      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
      : "bg-red-100 text-red-700 border-red-300";

  // ======== Report Downloads ========
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CIRCAD DCRM Analysis Report", 14, 20);
    doc.setFontSize(12);

    doc.text(`Status: ${status}`, 14, 35);
    doc.text(`Mean Resistance: ${mean_resistance} µΩ`, 14, 45);
    doc.text(`Std. Deviation: ${std_dev} µΩ`, 14, 55);
    doc.text(`Min Resistance: ${min_resistance} µΩ`, 14, 65);
    doc.text(`Max Resistance: ${max_resistance} µΩ`, 14, 75);

    if (predicted_condition)
      doc.text(
        `Model Prediction: ${predicted_condition} ${
          predicted_confidence
            ? `(${Math.round(predicted_confidence * 100)}%)`
            : ""
        }`,
        14,
        85
      );

    if (forecast_next_mean)
      doc.text(`Forecast Next Mean: ${forecast_next_mean} µΩ`, 14, 95);

    doc.text(
      `Created At: ${new Date(created_at).toLocaleString()}`,
      14,
      110
    );

    doc.save(`CIRCAD_Report_${id}.pdf`);
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ["Time (ms)", "Resistance (µΩ)"],
      ...data_points.map((p) => [p.time, p.resistance]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CIRCAD_Data_${id}.csv`);
    link.click();
  };

  // ======== UI ========
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-700">
        DCRM Analysis Report
      </h2>

      {/* ===== Status Card ===== */}
      <div
        className={`border ${statusColor} p-6 rounded-2xl shadow-sm space-y-1`}
      >
        <h3 className="text-xl font-semibold">
          Status: <span>{status}</span>
        </h3>
        <p className="text-sm text-gray-600">
          Created: {new Date(created_at).toLocaleString()}
        </p>
        <p className="text-lg">
          Mean Resistance: <strong>{mean_resistance} µΩ</strong>
        </p>
        <p className="text-sm text-gray-600">
          Std Dev: {std_dev} µΩ | Range: {min_resistance}–{max_resistance} µΩ
        </p>

        {predicted_condition && (
          <p className="pt-1">
            <strong>Model Prediction:</strong>{" "}
            <span
              className="inline-block px-2 py-0.5 rounded-md border text-sm"
              style={{
                borderColor: strokeColor,
                color: strokeColor,
                backgroundColor: `${strokeColor}15`,
              }}
            >
              {predicted_condition}
              {predicted_confidence
                ? ` (${Math.round(predicted_confidence * 100)}%)`
                : ""}
            </span>
          </p>
        )}

        {forecast_next_mean !== null && (
          <p className="pt-1">
            <strong>Forecast (next mean):</strong> {forecast_next_mean} µΩ
          </p>
        )}
      </div>

      {/* ===== Chart ===== */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h4 className="font-semibold mb-4 text-gray-700">
          Resistance vs Time
        </h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{
                value: "Time (ms)",
                position: "insideBottomRight",
                offset: -5,
              }}
            />
            <YAxis
              label={{
                value: "Resistance (µΩ)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            {/* actual line */}
            <Line
              type="monotone"
              dataKey="resistance"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            {/* dotted forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke={strokeColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Buttons ===== */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Download PDF Report
        </button>

        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
