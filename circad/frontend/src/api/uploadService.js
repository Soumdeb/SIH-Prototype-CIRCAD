// src/api/uploadService.js
import axiosInstance from "./axiosInstance";

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axiosInstance.post("/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Upload service error:", error);
    if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
    }
    throw error;
    }
};

export const analyzeFile = async (fileId) => {
  try {
    const response = await axiosInstance.post(`/analyze/${fileId}/`);
    return response.data;
  } catch (error) {
    console.error("Analysis service error:", error.response || error);
    throw error;
  }
};

export const fetchAllResults = async () => {
  try {
    const response = await axiosInstance.get("/results/");
    return response.data;
  } catch (error) {
    console.error("Error fetching analysis results:", error);
    throw error;
  }
};

export const fetchSystemHealth = async () => {
  const res = await axiosInstance.get("/system_health/");
  return res.data;
};

export const fetchForecastForAnalysis = async (analysisId) => {
  const res = await axiosInstance.get(`/forecast/analysis/${analysisId}/`);
  return res.data;
};
