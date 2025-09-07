import { Student, Transaction, GovernmentFiling, Gender, StudentStatus, SponsorshipStatus, YesNo, HealthStatus, InteractionStatus, TransportationType, Task, TaskStatus, TaskPriority, AcademicReport, FollowUpRecord } from '../types';
import { convertKeysToCamel, convertKeysToSnake } from '../utils/caseConverter';

// --- IMPORTANT ---
// This now reads the URL from your .env file.
// It falls back to a local server URL if the environment variable is not set.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';


// Generic API Client
const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const completeUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(completeUrl, {
        ...options,
        headers: {
            'Accept': 'application/json',
            // Do not set Content-Type for FormData, the browser does it with the correct boundary.
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...options.headers,
        },
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `API request failed with status ${response.status}` };
        }
        const errorMessage = Array.isArray(errorData.message) ? errorData.message.join(', ') : (errorData.detail || errorData.message);
        throw new Error(errorMessage || `An unknown API error occurred.`);
    }

    if (response.status === 204) { // Handle "No Content" responses
        return null;
    }

    const data = await response.json();
    
    // Function to fix image URLs to point to the live backend
    const fixPhotoUrl = (obj: any) => {
        if (obj && obj.profile_photo && !obj.profile_photo.startsWith('http')) {
            // Correctly construct the full URL from the relative path provided by Django
            const baseUrl = new URL(API_BASE_URL).origin;
            obj.profile_photo = `${baseUrl}${obj.profile_photo}`;
        }
        return obj;
    };

    // Recursively apply URL fix
    const fixUrlsInData = (data: any): any => {
        if (Array.isArray(data)) {
            return data.map(fixUrlsInData);
        } else if (data && typeof data === 'object') {
            return fixPhotoUrl(data);
        }
        return data;
    };
    
    // Centralized conversion: all incoming snake_case keys from Django are converted to camelCase here.
    return convertKeysToCamel(fixUrlsInData(data));
};

type StudentFormData = Omit<Student, 'profile_photo' | 'academic_reports' | 'follow_up_records' | 'out_of_program_date'> & { profile_photo?: File };

export const api = {
    getDashboardStats: async () => apiClient('/dashboard/stats/'),
    getStudents: async (): Promise<Student[]> => apiClient('/students/'),
    getStudentById: async (id: string): Promise<Student | undefined> => {
        try {
            return await apiClient(`/students/${id}/`);
        } catch (error) {
            console.error(`Student with id ${id} not found`, error);
            return undefined;
        }
    },

    addStudent: async (studentData: Omit<Student, 'academic_reports' | 'follow_up_records'> & { profile_photo?: File }) => {
        const { profile_photo, ...rest } = studentData;
        const snakeCaseData = convertKeysToSnake(rest);
        const formData = new FormData();
        Object.entries(snakeCaseData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                 if (typeof value === 'object' && !(value instanceof File)) {
                    formData.append(key, JSON.stringify(value));
                 } else {
                    formData.append(key, String(value));
                 }
            }
        });
        if (profile_photo) formData.append('profile_photo', profile_photo);
        return apiClient('/students/', { method: 'POST', body: formData });
    },

    updateStudent: async (studentData: StudentFormData) => {
        const { profile_photo, student_id, ...rest } = studentData;
        const snakeCaseData = convertKeysToSnake(rest);
        const formData = new FormData();
        Object.entries(snakeCaseData).forEach(([key, value]) => {
             if (value !== null && value !== undefined) {
                 if (typeof value === 'object' && !(value instanceof File)) {
                    formData.append(key, JSON.stringify(value));
                 } else {
                    formData.append(key, String(value));
                 }
            }
        });
        if (profile_photo instanceof File) formData.append('profile_photo', profile_photo);
        return apiClient(`/students/${student_id}/`, { method: 'PATCH', body: formData });
    },

    deleteStudent: async (studentId: string) => apiClient(`/students/${studentId}/`, { method: 'DELETE' }),
    getAllAcademicReports: async (): Promise<AcademicReport[]> => apiClient('/academic-reports/'),
    addAcademicReport: async (studentId: string, report: Omit<AcademicReport, 'id' | 'student_id' | 'student_name'>) => {
        const snakeCaseReport = convertKeysToSnake(report);
        return apiClient(`/students/${studentId}/academic-reports/`, { method: 'POST', body: JSON.stringify(snakeCaseReport) });
    },

    updateAcademicReport: async (studentId: string, reportId: string, updatedReportData: Omit<AcademicReport, 'id' | 'student_id' | 'student_name'>): Promise<AcademicReport> => {
        const snakeCaseReport = convertKeysToSnake(updatedReportData);
        return apiClient(`/academic-reports/${reportId}/`, { method: 'PATCH', body: JSON.stringify(snakeCaseReport) });
    },

    deleteAcademicReport: async (studentId: string, reportId: string) => apiClient(`/academic-reports/${reportId}/`, { method: 'DELETE' }),
    addFollowUpRecord: async (studentId: string, record: Omit<FollowUpRecord, 'id' | 'student_id'>) => {
        const snakeCaseRecord = convertKeysToSnake(record);
        return apiClient(`/students/${studentId}/follow-up-records/`, { method: 'POST', body: JSON.stringify(snakeCaseRecord) });
    },

    updateFollowUpRecord: async (studentId: string, updatedRecord: FollowUpRecord): Promise<FollowUpRecord> => {
        const { id, student_id, ...rest } = updatedRecord;
        const snakeCaseRecord = convertKeysToSnake(rest);
        return apiClient(`/follow-up-records/${id}/`, { method: 'PATCH', body: JSON.stringify(snakeCaseRecord) });
    },
    
    addBulkStudents: async (newStudentsData: Partial<Student>[]) => {
        let importedCount = 0;
        let skippedCount = 0;
        for (const s of newStudentsData) {
            if (!s.student_id) { skippedCount++; continue; }
            try {
                await api.addStudent(s as any);
                importedCount++;
            } catch (error) {
                console.error(`Failed to import student ${s.student_id}:`, error);
                skippedCount++;
            }
        }
        return { importedCount, skippedCount };
    },

    getRecentTransactions: async () => apiClient('/dashboard/recent-transactions/'),
    getTransactions: async (): Promise<Transaction[]> => apiClient('/transactions/'),
    addTransaction: async (data: Omit<Transaction, 'id'>) => apiClient('/transactions/', { method: 'POST', body: JSON.stringify(convertKeysToSnake(data)) }),
    updateTransaction: async (data: Transaction) => {
        const { id, ...rest } = data;
        return apiClient(`/transactions/${id}/`, { method: 'PATCH', body: JSON.stringify(convertKeysToSnake(rest)) });
    },
    deleteTransaction: async (id: string) => apiClient(`/transactions/${id}/`, { method: 'DELETE' }),
    getFilings: async (): Promise<GovernmentFiling[]> => apiClient('/filings/'),
    addFiling: async (data: Omit<GovernmentFiling, 'id'> & { attached_file?: File | string }) => {
        const { attached_file, ...rest } = data;
        const snakeData = convertKeysToSnake(rest);
        const formData = new FormData();
        Object.entries(snakeData).forEach(([key, value]) => formData.append(key, value as string));
        if (attached_file instanceof File) formData.append('attached_file', attached_file);
        return apiClient('/filings/', { method: 'POST', body: formData });
    },
    updateFiling: async (data: GovernmentFiling & { attached_file?: File | string }) => {
        const { id, attached_file, ...rest } = data;
        const snakeData = convertKeysToSnake(rest);
        const formData = new FormData();
        Object.entries(snakeData).forEach(([key, value]) => formData.append(key, value as string));
        if (attached_file instanceof File) formData.append('attached_file', attached_file);
        return apiClient(`/filings/${id}/`, { method: 'PATCH', body: formData });
    },
    deleteFiling: async (id: string) => apiClient(`/filings/${id}/`, { method: 'DELETE' }),
    getTasks: async (): Promise<Task[]> => apiClient('/tasks/'),
    addTask: async (data: Omit<Task, 'id'>): Promise<Task> => apiClient('/tasks/', { method: 'POST', body: JSON.stringify(convertKeysToSnake(data)) }),
    updateTask: async (data: Task): Promise<Task> => {
        const { id, ...rest } = data;
        return apiClient(`/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(convertKeysToSnake(rest)) });
    },
    deleteTask: async (id: string) => apiClient(`/tasks/${id}/`, { method: 'DELETE' }),
};