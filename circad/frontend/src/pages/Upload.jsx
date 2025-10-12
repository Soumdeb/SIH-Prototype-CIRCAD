import React, { useState } from "react";
import { uploadFile, analyzeFile } from "../api/uploadService";
import { checkTaskStatus } from "../api/reportService";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const { setAnalysisData } = useAnalysis();
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please choose a CSV file!");
    setLoading(true);
    setProgressMsg("Uploading file...");

    try {
      // 1️⃣ Upload file
      const uploadRes = await uploadFile(file);
      const fileId = uploadRes.file_id;
      setProgressMsg("File uploaded. Starting analysis...");

      // 2️⃣ Start Celery async analysis task
      const analysisStart = await analyzeFile(fileId);

      // Check if backend returned task_id
      if (!analysisStart.task_id) {
        // if backend performs analysis synchronously (fallback)
        setAnalysisData(analysisStart);
        navigate("/analysis");
        return;
      }

      const taskId = analysisStart.task_id;
      setProgressMsg("Analysis started. Please wait...");

      // 3️⃣ Poll every 5 seconds to check status
      const interval = setInterval(async () => {
        try {
          const taskRes = await checkTaskStatus(taskId);

          if (taskRes.status === "SUCCESS" && taskRes.result) {
            clearInterval(interval);
            setProgressMsg("Analysis complete! Redirecting...");
            setAnalysisData(taskRes.result);
            setTimeout(() => navigate("/analysis"), 1000);
          } else if (taskRes.status === "FAILURE") {
            clearInterval(interval);
            setProgressMsg("Analysis failed. Check backend logs.");
          } else {
            setProgressMsg(`Analysis running... [${taskRes.status}]`);
          }
        } catch (err) {
          console.error("Polling error:", err);
          clearInterval(interval);
          setProgressMsg("Error while checking task status.");
        }
      }, 5000);
    } catch (err) {
      console.error("Upload/Analysis failed:", err);
      alert("Something went wrong. Please check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-700">Upload DCRM Data</h2>
      <form
        onSubmit={handleUpload}
        className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4"
      >
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="block text-sm text-gray-600"
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-5 py-2 rounded-lg text-white transition ${
            loading ? "bg-gray-400" : "bg-cyan-600 hover:bg-cyan-700"
          }`}
        >
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>
      </form>

      {progressMsg && (
        <div className="mt-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-4">
          {progressMsg}
        </div>
      )}
    </div>
  );
};

export default Upload;
