import api from "./axiosInstance";

export const getSystemStatus = () => api.get("/admin/system_status/");
export const resetAll = () => api.post("/admin/reset_all/");
export const resetDBOnly = () => api.post("/admin/reset_db_only/");
export const clearUploads = () => api.post("/admin/clear_uploads/");
export const deleteFile = (id) => api.delete(`/admin/delete_file/${id}/`);
export const deleteAnalysis = (id) => api.delete(`/admin/delete_analysis/${id}/`);
