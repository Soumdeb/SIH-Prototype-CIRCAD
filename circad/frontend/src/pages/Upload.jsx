import React, { useState } from "react";
import { uploadFile, analyzeFile } from "../api/uploadService";
import { checkTaskStatus } from "../api/reportService";
import { useSafeAnalysis } from "../hooks/useSafeAnalysis";
import toast from "react-hot-toast";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const { setAnalysisData } = useSafeAnalysis();
  const username = localStorage.getItem("username");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a CSV file!");

    setLoading(true);
    setProgressMsg("Uploading file...");

    try {
      const uploadRes = await uploadFile(file);
      const fileId = uploadRes.file_id;
      setProgressMsg("File uploaded.");

      const analysisStart = await analyzeFile(fileId);
      if (!analysisStart.task_id) {
        setAnalysisData(analysisStart);
        toast.success("Analysis complete!");
        return;
      }

      const taskId = analysisStart.task_id;
      setProgressMsg("Analysis started. Please wait...");

      const interval = setInterval(async () => {
        const taskRes = await checkTaskStatus(taskId);
        if (taskRes.state === "SUCCESS" && taskRes.result) {
          clearInterval(interval);
          setProgressMsg("Analysis complete!");
          toast.success("Analysis complete!");
          setAnalysisData(taskRes.result);
          localStorage.setItem("lastAnalysis", JSON.stringify(taskRes.result));
          setTimeout(() => window.dispatchEvent(new Event("openAnalysis")), 300);
        } else if (taskRes.state === "FAILURE") {
          clearInterval(interval);
          toast.error("Analysis failed.");
        }
      }, 5000);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 w-full h-full text-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">Upload DCRM Data</h1>
          <p className="text-sm text-gray-400">
            Upload a CSV file for automatic resistance analysis.
          </p>
        </div>
        <span className="text-sm text-gray-400 mt-2 md:mt-0">
          User: {username}
        </span>
      </div>

      <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
        <form onSubmit={handleUpload} className="flex flex-col gap-6">
          <div className="border-2 border-dashed border-gray-500 rounded-xl p-10 text-center hover:border-cyan-400 transition">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer text-cyan-400">
              {file ? file.name : "Click to select a CSV file"}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              loading ? "bg-slate-600" : "bg-cyan-600 hover:bg-cyan-700"
            }`}
          >
            {loading ? "Processing..." : "Upload & Analyze"}
          </button>
        </form>

        {progressMsg && (
          <div className="mt-6 bg-slate-900/70 border border-slate-700 rounded-lg p-4 text-center text-gray-300">
            {progressMsg}
          </div>
        )}
      </div>
    </div>
  );
}
