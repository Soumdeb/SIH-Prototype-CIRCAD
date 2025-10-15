// src/components/UploadCard.jsx
import React, { useState } from "react";
import { uploadFile, analyzeFile } from "../api/uploadService";
import { useAnalysis } from "../context/AnalysisContext";
import { useNavigate } from "react-router-dom";

export default function UploadCard() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const { setAnalysisData } = useAnalysis();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Choose CSV");
    setLoading(true);
    setMsg("Uploading...");
    try {
      const uploadRes = await uploadFile(file);
      const fileId = uploadRes.file_id;
      setMsg("Uploaded — starting analysis...");
      const res = await analyzeFile(fileId);
      if (!res.task_id) {
        setAnalysisData(res);
        navigate("/analysis");
      } else {
        setMsg("Analysis queued. It may take a few moments.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
      <div>
        <button disabled={loading} className="px-3 py-1 rounded bg-cyan-600 text-white">
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {msg && <div className="text-sm text-gray-600">{msg}</div>}
    </form>
  );
}
