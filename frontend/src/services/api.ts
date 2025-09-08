import { Student, Transaction, GovernmentFiling, Task, AcademicReport, FollowUpRecord, PaginatedResponse, StudentLookup } from '../types.ts';
import { convertKeysToCamel, convertKeysToSnake } from '../utils/caseConverter.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const completeUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const requestId = Date.now() + Math.random();

    window.dispatchEvent(new CustomEvent('api-request-start', { detail: { requestId, endpoint, method: options.method || 'GET' } }));

    let response;
    try {
        response = await fetch(completeUrl, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
                ...options.headers,
            },
        });

        if (!response.ok) {
            let errorData;
            let errorMessage = `API request failed with status ${response.status}.`;
            try {
                errorData = await response.json();
                if (typeof errorData === 'object' && errorData !== null) {
                    if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else if (errorData.message) {
                        errorMessage = Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
                    } else {
                        const fieldErrors = Object.entries(errorData)
                            .map(([field, errors]) => `${field}: ${(Array.isArray(errors) ? errors.join(', ') : errors)}`)
                            .join('; ');
                        if (fieldErrors) {
                            errorMessage = fieldErrors;
                        }
                    }
                }
            } catch (e) { /* response was not json */ }
            throw new Error(errorMessage);
        }

        if (response.status === 204) return null;

        const data = await response.json();
        
        const fixPhotoUrl = (obj: any) => {
            if (obj && obj.profile_photo && !obj.profile_photo.startsWith('http')) {
                const baseUrl = new URL(API_BASE_URL).origin;
                obj.profile_photo = `${baseUrl}${obj.profile_photo}`;
            }
            return obj;
        };

        const fixUrlsInData = (data: any): any => {
            if (Array.isArray(data)) return data.map(fixUrlsInData);
            if (data && typeof data === 'object') {
                 // Handle paginated response
                if (data.results && Array.isArray(data.results)) {
                    data.results = data.results.map(fixUrlsInData);
                    return data;
                }
                return fixPhotoUrl(data);
            }
            return data;
        };

        return convertKeysToCamel(fixUrlsInData(data));

    } catch (error) {
        throw error;
    } finally {
        window.dispatchEvent(new CustomEvent('api-request-end', { 
            detail: { 
                requestId, 
                endpoint, 
                method: options.method || 'GET', 
                status: response?.status, 
                ok: response?.ok 
            } 
        }));
    }
};

type StudentFormData = Omit<Student, 'profilePhoto' | 'academicReports' | 'followUpRecords' | 'outOfProgramDate'> & { profilePhoto?: File; outOfProgramDate?: string | null };

const prepareStudentData = (studentData: any) => {
    const data = { ...studentData };
    // Convert empty strings for nullable date fields to null
    if (data.outOfProgramDate === '') {
        data.outOfProgramDate = null;
    }
    return data;
};

export const api = {
    getDashboardStats: async (dateRange?: { start: string, end: string }) => {
        const params = new URLSearchParams();
        if (dateRange) {
            params.append('start_date', dateRange.start);
            params.append('end_date', dateRange.end);
        }
        return apiClient(`/dashboard/stats/?${params.toString()}`);
    },
    getRecentTransactions: async () => apiClient('/dashboard/recent-transactions/'),

    // PAGINATED LISTS
    getStudents: async (queryString: string): Promise<PaginatedResponse<Student>> => apiClient(`/students/?${queryString}`),
    getTransactions: async (queryString: string): Promise<PaginatedResponse<Transaction>> => apiClient(`/transactions/?${queryString}`),
    getAllAcademicReports: async (queryString: string): Promise<PaginatedResponse<AcademicReport>> => apiClient(`/academic-reports/?${queryString}`),
    getFilings: async (queryString: string): Promise<PaginatedResponse<GovernmentFiling>> => apiClient(`/filings/?${queryString}`),
    getTasks: async (queryString: string): Promise<PaginatedResponse<Task>> => apiClient(`/tasks/?${queryString}`),
    
    // LOOKUPS (for dropdowns)
    getStudentLookup: async (): Promise<StudentLookup[]> => apiClient('/students/lookup/'),
    
    // Student Endpoints
    getStudentById: async (id: string): Promise<Student> => apiClient(`/students/${id}/`),
    addStudent: async (studentData: Omit<Student, 'academicReports' | 'followUpRecords'> & { profilePhoto?: File }) => {
        const { profilePhoto, ...rest } = studentData;
        const preparedData = prepareStudentData(rest);
        const snakeCaseData = convertKeysToSnake(preparedData);
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
        if (profilePhoto) formData.append('profile_photo', profilePhoto);
        return apiClient('/students/', { method: 'POST', body: formData });
    },
    updateStudent: async (studentData: StudentFormData) => {
        const { profilePhoto, studentId, ...rest } = studentData;
        const preparedData = prepareStudentData(rest);
        const snakeCaseData = convertKeysToSnake(preparedData);
        const formData = new FormData();
        Object.entries(snakeCaseData).forEach(([key, value]) => {
             if (value !== undefined) { // Send null values
                 if (typeof value === 'object' && value !== null && !(value instanceof File)) {
                    formData.append(key, JSON.stringify(value));
                 } else if (value === null) {
                    formData.append(key, ''); // Django multipart forms interpret empty string as null for non-file fields
                 }
                 else {
                    formData.append(key, String(value));
                 }
            }
        });
        if (profilePhoto instanceof File) formData.append('profile_photo', profilePhoto);
        return apiClient(`/students/${studentId}/`, { method: 'PATCH', body: formData });
    },
    deleteStudent: async (studentId: string) => apiClient(`/students/${studentId}/`, { method: 'DELETE' }),
    addBulkStudents: async (newStudentsData: Partial<Student>[]): Promise<{ createdCount: number, updatedCount: number, skippedCount: number, errors: string[] }> => {
        const snakeCaseData = convertKeysToSnake(newStudentsData);
        return apiClient('/students/bulk_import/', {
            method: 'POST',
            body: JSON.stringify(snakeCaseData)
        });
    },

    // Academic Report Endpoints
    addAcademicReport: async (studentId: string, report: Omit<AcademicReport, 'id' | 'studentId' | 'studentName'>) => {
        return apiClient(`/students/${studentId}/academic-reports/`, { method: 'POST', body: JSON.stringify(convertKeysToSnake(report)) });
    },
    updateAcademicReport: async (reportId: string, updatedReportData: Omit<AcademicReport, 'id' | 'studentId' | 'studentName'>): Promise<AcademicReport> => {
        return apiClient(`/academic-reports/${reportId}/`, { method: 'PATCH', body: JSON.stringify(convertKeysToSnake(updatedReportData)) });
    },
    deleteAcademicReport: async (reportId: string) => apiClient(`/academic-reports/${reportId}/`, { method: 'DELETE' }),

    // Follow-up Record Endpoints
    addFollowUpRecord: async (studentId: string, record: Omit<FollowUpRecord, 'id' | 'studentId'>) => {
        return apiClient(`/students/${studentId}/follow-up-records/`, { method: 'POST', body: JSON.stringify(convertKeysToSnake(record)) });
    },
    updateFollowUpRecord: async (recordId: string, updatedRecord: Omit<FollowUpRecord, 'id' | 'studentId'>): Promise<FollowUpRecord> => {
        return apiClient(`/follow-up-records/${recordId}/`, { method: 'PATCH', body: JSON.stringify(convertKeysToSnake(updatedRecord)) });
    },
    
    // Transaction Endpoints
    addTransaction: async (data: Omit<Transaction, 'id'>) => apiClient('/transactions/', { method: 'POST', body: JSON.stringify(convertKeysToSnake(data)) }),
    updateTransaction: async (data: Transaction) => {
        const { id, ...rest } = data;
        return apiClient(`/transactions/${id}/`, { method: 'PATCH', body: JSON.stringify(convertKeysToSnake(rest)) });
    },
    deleteTransaction: async (id: string) => apiClient(`/transactions/${id}/`, { method: 'DELETE' }),

    // Filing Endpoints
    addFiling: async (data: Omit<GovernmentFiling, 'id'> & { attached_file?: File | string }) => {
        const { attached_file, ...rest } = data;
        const formData = new FormData();
        Object.entries(convertKeysToSnake(rest)).forEach(([key, value]) => formData.append(key, value as string));
        if (attached_file instanceof File) formData.append('attached_file', attached_file);
        return apiClient('/filings/', { method: 'POST', body: formData });
    },
    updateFiling: async (data: GovernmentFiling & { attached_file?: File | string }) => {
        const { id, attached_file, ...rest } = data;
        const formData = new FormData();
        Object.entries(convertKeysToSnake(rest)).forEach(([key, value]) => formData.append(key, value as string));
        if (attached_file instanceof File) formData.append('attached_file', attached_file);
        return apiClient(`/filings/${id}/`, { method: 'PATCH', body: formData });
    },
    deleteFiling: async (id: string) => apiClient(`/filings/${id}/`, { method: 'DELETE' }),

    // Task Endpoints
    addTask: async (data: Omit<Task, 'id'>): Promise<Task> => apiClient('/tasks/', { method: 'POST', body: JSON.stringify(convertKeysToSnake(data)) }),
    updateTask: async (data: Task): Promise<Task> => {
        const { id, ...rest } = data;
        return apiClient(`/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(convertKeysToSnake(rest)) });
    },
    deleteTask: async (id: string) => apiClient(`/tasks/${id}/`, { method: 'DELETE' }),
};
