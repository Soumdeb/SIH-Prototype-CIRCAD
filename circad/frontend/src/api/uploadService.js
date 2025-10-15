// src/api/uploadService.js
import axiosInstance from "./axiosInstance";

// ✅ Define base URL explicitly (or get from env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ==============================
// 1️⃣ Upload DCRM file
// ==============================
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post("/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ==============================
// 2️⃣ Trigger file analysis
// ==============================
export const analyzeFile = async (file_id) => {
  const response = await axiosInstance.post(`/analyze/${file_id}/`);
  return response.data;
};

// ==============================
// 3️⃣ Fetch all analysis results (auto-merge all pages)
// ==============================
export const fetchAllResults = async () => {
  try {
    let url = `${API_BASE_URL}/api/results/`;
    let allResults = [];

    // Loop until no next page
    while (url) {
      const res = await axiosInstance.get(url);
      const data = res.data;

      if (Array.isArray(data)) {
        // Non-paginated case
        allResults = allResults.concat(data);
        break;
      }

      if (data.results && Array.isArray(data.results)) {
        // Paginated case
        allResults = allResults.concat(data.results);
        url = data.next; // Move to next page if exists
      } else {
        console.error("Unexpected results response:", data);
        break;
      }
    }

    return allResults;
  } catch (err) {
    console.error("Failed to fetch results:", err);
    return [];
  }
};

// ==============================
// 4️⃣ Fetch system health index
// ==============================
export const fetchSystemHealth = async () => {
  const res = await axiosInstance.get("/system_health/");
  return res.data;
};

// ==============================
// 5️⃣ Fetch forecast for a specific analysis
// ==============================
export const fetchForecastForAnalysis = async (analysisId) => {
  const res = await axiosInstance.get(`/forecast/analysis/${analysisId}/`);
  return res.data;
};
