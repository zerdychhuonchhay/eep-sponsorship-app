import { http, HttpResponse } from 'msw';
import { mockUser, mockStudents, mockTransactions, mockUsers, mockSponsorLookup, mockStudentLookup, mockGroups, mockRoles } from './data.ts';

// Use a variable for the base URL to keep it consistent.
// Note: This must match the VITE_API_BASE_URL in your .env file.
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const handlers = [
  // --- AUTH ---
  http.post(`${API_BASE_URL}/token/`, () => {
    return HttpResponse.json({
      access: 'mock-access-token-string-12345',
      refresh: 'mock-refresh-token-string-67890',
    });
  }),

  http.get(`${API_BASE_URL}/user/me/`, () => {
    return HttpResponse.json(mockUser);
  }),

  // --- LOOKUPS ---
  http.get(`${API_BASE_URL}/students/lookup/`, () => {
    return HttpResponse.json(mockStudentLookup);
  }),
  http.get(`${API_BASE_URL}/sponsors/lookup/`, () => {
    return HttpResponse.json(mockSponsorLookup);
  }),
  http.get(`${API_BASE_URL}/groups/`, () => {
    return HttpResponse.json(mockGroups);
  }),
  http.get(`${API_BASE_URL}/roles/`, () => {
    return HttpResponse.json(mockRoles);
  }),
  
  // --- STUDENTS ---
  http.get(`${API_BASE_URL}/students/`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = 15;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedStudents = mockStudents.slice(start, end);

    return HttpResponse.json({
      count: mockStudents.length,
      next: end < mockStudents.length ? `${API_BASE_URL}/students/?page=${page + 1}` : null,
      previous: page > 1 ? `${API_BASE_URL}/students/?page=${page - 1}` : null,
      results: paginatedStudents,
    });
  }),

  // --- TRANSACTIONS ---
  http.get(`${API_BASE_URL}/transactions/`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = 15;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginated = mockTransactions.slice(start, end);
    
    return HttpResponse.json({
      count: mockTransactions.length,
      next: end < mockTransactions.length ? `${API_BASE_URL}/transactions/?page=${page + 1}` : null,
      previous: page > 1 ? `${API_BASE_URL}/transactions/?page=${page - 1}` : null,
      results: paginated,
    });
  }),
  
  // --- USER MANAGEMENT ---
  http.get(`${API_BASE_URL}/users/`, () => {
    return HttpResponse.json({
      count: mockUsers.length,
      next: null,
      previous: null,
      results: mockUsers,
    });
  }),
];
