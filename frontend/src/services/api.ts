import { Student, Transaction, GovernmentFiling, Task, AcademicReport, FollowUpRecord, PaginatedResponse, StudentLookup, AuditLog, Sponsor, SponsorLookup, User, AppUser, Role, Permissions } from '../types.ts';
import { convertKeysToCamel, convertKeysToSnake } from '../utils/caseConverter.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const logDebugEvent = (message: string, type: 'api_success' | 'api_error' | 'info', duration?: number) => {
    window.dispatchEvent(new CustomEvent('debug-log', { detail: { message, type, duration } }));
};

class ApiError extends Error {
    constructor(message: string, public status: number, public data: any) {
        super(message);
        this.name = 'ApiError';
    }
}

// Helper to centralize logout logic
const logoutUser = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.hash = '/login';
};


let isRefreshing = false;
let failedRequestQueue: { resolve: (token: string) => void; reject: (error: Error) => void; }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedRequestQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token!);
        }
    });
    failedRequestQueue = [];
};

const apiClient = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const completeUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const startTime = Date.now();
    let token = localStorage.getItem('accessToken');

    // If a token refresh is in progress, wait for it to complete
    if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
            failedRequestQueue.push({ resolve, reject });
        }).then(() => {
             // The original request will be retried by the refreshed apiClient call.
             // It will pick up the new token from localStorage automatically.
             return apiClient(endpoint, options);
        });
    }

    try {
        const response = await fetch(completeUrl, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });
        
        const duration = Date.now() - startTime;

        if (!response.ok) {
            // --- REFRESH TOKEN LOGIC ---
            if (response.status === 401 && !completeUrl.includes('/token/')) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    logoutUser();
                    throw new ApiError('Session expired. Please log in again.', 401, null);
                }
                
                isRefreshing = true;

                try {
                    const refreshResponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh: refreshToken }),
                    });

                    if (!refreshResponse.ok) {
                        logoutUser(); // Refresh token failed, log out
                        const err = new Error('Session expired.');
                        processQueue(err, null);
                        let errorMessage = 'Session expired. Please log in again.';
                        if (refreshResponse.status >= 500) {
                            errorMessage = 'A server error occurred while refreshing your session. Please log in again.';
                        }
                        throw new ApiError(errorMessage, 401, null);
                    }

                    const { access } = await refreshResponse.json();
                    localStorage.setItem('accessToken', access);
                    processQueue(null, access);

                    // Retry the original request with the new token
                    return apiClient(endpoint, options);

                } catch (e) {
                    logoutUser(); // Network error or other issue during refresh
                    processQueue(e as Error, null);
                    throw e;
                } finally {
                    isRefreshing = false;
                }
            }
            
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
            
            const error = new ApiError(errorMessage, response.status, errorData);
            logDebugEvent(`[${options.method || 'GET'}] ${endpoint} failed (${response.status}) - ${errorMessage}`, 'api_error', duration);
            throw error;
        }
        
        logDebugEvent(`[${options.method || 'GET'}] ${endpoint} succeeded (${response.status})`, 'api_success', duration);
        
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

    } catch (error: any) {
        if (!(error instanceof ApiError)) {
             const duration = Date.now() - startTime;
             logDebugEvent(`Network Error: ${error.message} for [${options.method || 'GET'}] ${endpoint}`, 'api_error', duration);
        }
        throw error;
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

const prepareTransactionData = (data: any) => {
    const snakeData = convertKeysToSnake(data);
    if ('student_id' in snakeData) {
        snakeData.student = snakeData.student_id;
        delete snakeData.student_id;
    }
    return snakeData;
};

const queryAIAssistantForStudentFilters = async (query: string): Promise<any> => {
    try {
        const response = await apiClient('/ai-assistant/student-filters/', {
            method: 'POST',
            body: JSON.stringify({ query })
        });
        return response;
    } catch (error) {
        console.error("Error querying AI for filters:", error);
        throw new Error("The AI assistant could not process your request. Please try again.");
    }
};

export const api = {
    // Auth Endpoints
    login: async (username: string, password: string): Promise<{ accessToken: string, refreshToken: string }> => {
        const response = await apiClient('/token/', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        // The backend returns access and refresh tokens with snake_case.
        return { accessToken: response.access, refreshToken: response.refresh };
    },
    refreshToken: async (): Promise<{ accessToken: string }> => {
        const currentRefreshToken = localStorage.getItem('refreshToken');
        if (!currentRefreshToken) {
            throw new ApiError('No refresh token available.', 401, null);
        }

        const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: currentRefreshToken }),
        });

        if (!response.ok) {
            // This is critical. If the refresh token itself fails, we must log out.
            logoutUser();
            const errorData = await response.json();
            throw new ApiError(errorData.detail || 'Session expired.', response.status, errorData);
        }
        
        const data = await response.json();
        return { accessToken: data.access };
    },
    signup: async (username: string, email: string, password: string): Promise<{ message: string }> => {
        return apiClient('/register/', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, password2: password }),
        });
    },
    getCurrentUser: async (): Promise<User> => {
        const userData = await apiClient('/user/me/');
        if (userData.isAdmin && !userData.role) {
            userData.role = 'Administrator';
        }
        if (!userData.permissions) {
             console.warn("User permissions not provided by backend. UI will be restricted.");
             userData.permissions = {};
        }
        return userData;
    },
    updateUserProfile: async (data: FormData): Promise<User> => {
        return apiClient('/user/me/', {
            method: 'PATCH',
            body: data,
        });
    },
    changePassword: async (data: any): Promise<{ detail: string }> => {
        return apiClient('/user/change-password/', {
            method: 'POST',
            body: JSON.stringify(convertKeysToSnake(data)),
        });
    },
    requestPasswordReset: async (email: string): Promise<{ message: string }> => {
        return apiClient('/users/request-password-reset/', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },
    confirmPasswordReset: async (data: any): Promise<{ message: string }> => {
        return apiClient('/users/password-reset-confirm/', {
            method: 'POST',
            body: JSON.stringify(convertKeysToSnake(data)),
        });
    },
    
    // User & Role Management Endpoints
    getUsers: async (queryString: string): Promise<PaginatedResponse<AppUser>> => {
        const responseData = await apiClient(`/users/?${queryString}`);
        if (Array.isArray(responseData)) {
            return { count: responseData.length, next: null, previous: null, results: responseData, };
        }
        return responseData;
    },
    inviteUser: async (email: string, role: string): Promise<{ message: string }> => {
        return apiClient('/users/invite/', {
            method: 'POST',
            body: JSON.stringify(convertKeysToSnake({ email, role })),
        });
    },
    updateUser: async (userId: number, data: Partial<Pick<AppUser, 'role' | 'status'>>): Promise<AppUser> => {
        return apiClient(`/users/${userId}/`, {
            method: 'PATCH',
            body: JSON.stringify(convertKeysToSnake(data))
        });
    },
    deleteUser: async (userId: number) => apiClient(`/users/${userId}/`, { method: 'DELETE' }),
    
    // New Group/Role Management
    getGroups: async (): Promise<Pick<Role, 'id' | 'name'>[]> => apiClient('/groups/'),
    addGroup: async (name: string): Promise<Role> => apiClient('/groups/', { method: 'POST', body: JSON.stringify({ name }) }),
    updateGroup: async (id: number, name: string): Promise<Role> => apiClient(`/groups/${id}/`, { method: 'PATCH', body: JSON.stringify({ name }) }),
    deleteGroup: async (id: number) => apiClient(`/groups/${id}/`, { method: 'DELETE' }),
    
    // Permissions Management
    getRolePermissions: async (): Promise<Role[]> => apiClient('/roles/'),
    updateRolePermissions: async (roleName: string, permissions: Permissions): Promise<Role> => {
        return apiClient(`/roles/${roleName}/`, {
            method: 'PATCH',
            body: JSON.stringify({ permissions: permissions })
        });
    },

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
    getAuditLogs: async (queryString: string): Promise<PaginatedResponse<AuditLog>> => apiClient(`/audit-logs/?${queryString}`),
    getSponsors: async (queryString: string): Promise<PaginatedResponse<Sponsor>> => apiClient(`/sponsors/?${queryString}`),

    // LOOKUPS (for dropdowns)
    getStudentLookup: async (): Promise<StudentLookup[]> => apiClient('/students/lookup/'),
    getSponsorLookup: async (): Promise<SponsorLookup[]> => apiClient('/sponsors/lookup/'),
    
    // DYNAMIC FILTER OPTIONS
    getTransactionFilterOptions: async (): Promise<{ categories: string[] }> => {
        // This is a simulated endpoint. In a real app, this would hit the backend.
        // For now, it returns a static list similar to the old constant.
        console.log("Simulating API call to fetch transaction filter options.");
        const categories = [
            'Donation', 'Grant', 'School Fees', 'Utilities', 'Salaries',
            'Rent', 'Supplies', 'Hot Lunches', 'Gifts', 'Transportation',
            'Other Income', 'Other Expense',
        ].sort();
        return Promise.resolve({ categories });
    },
    getAcademicFilterOptions: async (): Promise<{ years: string[], grades: string[] }> => {
        // This is a simulated endpoint. In a real app, this would hit the backend.
        console.log("Simulating API call to fetch academic filter options.");
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
        const grades = Array.from({ length: 12 }, (_, i) => String(i + 1));
        return Promise.resolve({ years, grades });
    },

    // Student Endpoints
    getStudentsByIds: async (studentIds: string[]): Promise<Student[]> => {
        return apiClient('/students/bulk_details/', {
            method: 'POST',
            body: JSON.stringify({ student_ids: studentIds })
        });
    },
    getAllStudentsForReport: async (filters: Record<string, string> = {}): Promise<Student[]> => {
        const params = new URLSearchParams(filters);
        const queryString = params.toString();
        return apiClient(`/students/all/?${queryString}`);
    },
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
    bulkUpdateStudents: async (studentIds: string[], updates: Partial<Pick<Student, 'studentStatus' | 'sponsorshipStatus'>>): Promise<{ updatedCount: number }> => {
        const payload = {
            student_ids: studentIds,
            updates: convertKeysToSnake(updates),
        };
        return apiClient('/students/bulk_update/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // Academic Report Endpoints
    addAcademicReport: async (studentId: string, report: Omit<AcademicReport, 'id' | 'student' | 'studentName'>) => {
        return apiClient(`/students/${studentId}/academic-reports/`, { method: 'POST', body: JSON.stringify(convertKeysToSnake(report)) });
    },
    updateAcademicReport: async (reportId: string, updatedReportData: Partial<Omit<AcademicReport, 'id' | 'studentName'>>): Promise<AcademicReport> => {
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
    getTransactionsForReport: async (dateRange: { start: string, end: string }): Promise<Transaction[]> => {
        const params = new URLSearchParams(dateRange);
        return apiClient(`/transactions/all/?${params.toString()}`);
    },
    addTransaction: async (data: Omit<Transaction, 'id'>) => {
        const payload = prepareTransactionData(data);
        return apiClient('/transactions/', { method: 'POST', body: JSON.stringify(payload) });
    },
    updateTransaction: async (data: Transaction) => {
        const { id, ...rest } = data;
        const payload = prepareTransactionData(rest);
        return apiClient(`/transactions/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
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

    // Sponsor Endpoints
    getSponsorById: async (id: string): Promise<Sponsor> => apiClient(`/sponsors/${id}/`),
    addSponsor: async (data: Omit<Sponsor, 'id' | 'sponsoredStudentCount'>): Promise<Sponsor> => apiClient('/sponsors/', { method: 'POST', body: JSON.stringify(convertKeysToSnake(data)) }),
    updateSponsor: async (data: Omit<Sponsor, 'sponsoredStudentCount'>): Promise<Sponsor> => {
        const { id, ...rest } = data;
        return apiClient(`/sponsors/${id}/`, { method: 'PATCH', body: JSON.stringify(convertKeysToSnake(rest)) });
    },
    deleteSponsor: async (id: string) => apiClient(`/sponsors/${id}/`, { method: 'DELETE' }),

    // AI Assistant
    queryAIAssistant: async (prompt: string, conversationHistory: any[]): Promise<{ response: string }> => {
        return apiClient('/ai-assistant/query/', {
            method: 'POST',
            body: JSON.stringify({ prompt, history: conversationHistory })
        });
    },
    queryAIAssistantForStudentFilters,
};