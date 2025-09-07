// frontend/src/apiConfig.js

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log('VITE_API_BASE_URL read by the app:', import.meta.env.VITE_API_BASE_URL);

// Define all endpoints in one place
export const API_ENDPOINTS = {
  students: `${API_BASE_URL}/api/students/`,
  schools: `${API_BASE_URL}/api/schools/`,
  academicReports: `${API_BASE_URL}/api/academic-reports/`,
  followUpRecords: `${API_BASE_URL}/api/follow-up-records/`,
  transactions: `${API_BASE_URL}/api/transactions/`,
  govFilings: `${API_BASE_URL}/api/gov-filings/`,
  excelFileAnalyzer: `${API_BASE_URL}/api/import/analyze/`,
  studentUploadPreview: `${API_BASE_URL}/api/students/upload-preview/`,
  studentBulkCreate: `${API_BASE_URL}/api/students/bulk-create/`,
  dashboardStats: `${API_BASE_URL}/api/dashboard-stats/`,
};