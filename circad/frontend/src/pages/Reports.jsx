import React, { useEffect, useState } from "react";
import { fetchAllResults } from "../api/uploadService";
import { requestPdfReport, requestCsvReport } from "../api/reportService";

export default function ReportsPage() {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("CIRCAD Batch Report");
  const [includeSignature, setIncludeSignature] = useState(false);
  const [technicianName, setTechnicianName] = useState("");

  useEffect(() => {
    (async () => {
      const data = await fetchAllResults();
      setResults(data);
    })();
  }, []);

  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePdf = async () => {
    setLoading(true);
    try {
      const ids = Array.from(selected);
      const res = await requestPdfReport(ids, { title, include_signature: includeSignature, technician_name: technicianName });
      const blob = new Blob([res.data], { type: "application/pdf" });
      downloadBlob(blob, `${title.replace(/\s+/g,'_')}.pdf`);
      alert("PDF downloaded");
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleCsv = async () => {
    setLoading(true);
    try {
      const ids = Array.from(selected);
      const res = await requestCsvReport(ids);
      const blob = new Blob([res.data], { type: "text/csv" });
      downloadBlob(blob, `circad_analyses.csv`);
      alert("CSV downloaded");
    } catch (e) {
      console.error(e);
      alert("Failed to generate CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Reports</h2>

      <div className="flex gap-4 items-center">
        <input className="border p-2" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeSignature} onChange={(e)=>setIncludeSignature(e.target.checked)} />
          Include Signature
        </label>
        <input className="border p-2" placeholder="Technician name" value={technicianName} onChange={(e)=>setTechnicianName(e.target.value)} />
        <button onClick={handlePdf} className="bg-blue-600 text-white px-4 py-2 rounded">Download PDF</button>
        <button onClick={handleCsv} className="bg-green-600 text-white px-4 py-2 rounded">Download CSV</button>
        <span className="text-sm text-gray-500">Select analyses below</span>
      </div>

      <div className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th></th><th>ID</th><th>File</th><th>Status</th><th>Mean (µΩ)</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id} className="border-b">
                <td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggle(r.id)} /></td>
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