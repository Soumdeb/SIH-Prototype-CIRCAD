import React, { useState } from "react";
import { uploadFile, analyzeFile } from "../api/uploadService";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setAnalysisData } = useAnalysis();
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please choose a file!");
    setLoading(true);
    try {
      const uploadRes = await uploadFile(file);
      const analysisRes = await analyzeFile(uploadRes.file_id);
      setAnalysisData(analysisRes);
      navigate("/analysis");
    } catch {
      alert("Upload failed. Please check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-700">Upload DCRM Data</h2>
      <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="block text-sm text-gray-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-600 text-white px-5 py-2 rounded-lg hover:bg-cyan-700 transition"
        >
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>
      </form>
    </div>
  );
};

export default Upload;
