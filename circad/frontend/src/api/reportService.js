import axiosInstance from "./axiosInstance";

export const requestPdfReport = async (analysisIds = [], options = {}) => {
  const res = await axiosInstance.post("/reports/pdf/", {
    analysis_ids: analysisIds,
    title: options.title || "CIRCAD_Report",
    include_signature: !!options.include_signature,
    technician_name: options.technician_name || ""
  }, { responseType: "blob" });
  return res;
};

export const requestCsvReport = async (analysisIds = []) => {
  const res = await axiosInstance.post("/reports/csv/", { analysis_ids: analysisIds }, { responseType: "blob" });
  return res;
};

export const checkTaskStatus = async (taskId) => {
  try {
    const res = await axiosInstance.get(`/task/${taskId}/status/`);
    return res.data;
  } catch (err) {
    console.error("Task check error:", err);
    return { status: "ERROR" };
  }
};