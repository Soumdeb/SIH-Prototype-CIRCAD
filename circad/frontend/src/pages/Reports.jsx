import React, { useEffect, useState } from "react";
import { fetchAllResults } from "../api/uploadService";
import { requestPdfReport, requestCsvReport } from "../api/reportService";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [title, setTitle] = useState("CIRCAD Batch Report");
  const [includeSignature, setIncludeSignature] = useState(false);
  const [technicianName, setTechnicianName] = useState("");

  useEffect(() => {
    fetchAllResults().then(setResults).catch(() => toast.error("Failed to load results"));
  }, []);

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdf = async () => {
    try {
      const ids = Array.from(selected);
      const res = await requestPdfReport(ids, {
        title,
        include_signature: includeSignature,
        technician_name: technicianName,
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      downloadBlob(blob, `${title.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const handleCsv = async () => {
    try {
      const ids = Array.from(selected);
      const res = await requestCsvReport(ids);
      const blob = new Blob([res.data], { type: "text/csv" });
      downloadBlob(blob, `circad_reports.csv`);
      toast.success("CSV downloaded!");
    } catch {
      toast.error("Failed to generate CSV");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-cyan-400">Reports</h2>

      <div className="flex flex-wrap gap-4 items-center text-gray-300">
        <input
          className="border border-slate-600 bg-slate-800 rounded px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeSignature}
            onChange={(e) => setIncludeSignature(e.target.checked)}
          />
          Include Signature
        </label>
        <input
          className="border border-slate-600 bg-slate-800 rounded px-3 py-2"
          placeholder="Technician Name"
          value={technicianName}
          onChange={(e) => setTechnicianName(e.target.value)}
        />
        <button
          onClick={handlePdf}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Download PDF
        </button>
        <button
          onClick={handleCsv}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
        >
          Download CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-200">
          <thead className="border-b border-slate-700">
            <tr>
              <th></th>
              <th>ID</th>
              <th>File</th>
              <th>Status</th>
              <th>Mean (µΩ)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-800/60">
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td>{r.id}</td>
                <td>{r.dcrm_file}</td>
                <td>{r.result_json.status}</td>
                <td>{r.result_json.mean_resistance}</td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
