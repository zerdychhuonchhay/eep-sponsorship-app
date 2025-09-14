// This file contains mock data that simulates the responses from the Django backend.
// Note: All keys are in snake_case to match the API response format.

import { UserStatus, StudentStatus, SponsorshipStatus, Gender, TransactionType } from "@/types.ts";

export const mockUser = {
  id: 1,
  username: 'mockadmin',
  email: 'admin@example.com',
  is_admin: true,
  role: 'Administrator',
  permissions: {
    students: { create: true, read: true, update: true, delete: true },
    sponsors: { create: true, read: true, update: true, delete: true },
    transactions: { create: true, read: true, update: true, delete: true },
    academics: { create: true, read: true, update: true, delete: true },
    tasks: { create: true, read: true, update: true, delete: true },
    filings: { create: true, read: true, update: true, delete: true },
    reports: { create: true, read: true, update: true, delete: true },
    audit: { create: true, read: true, update: true, delete: true },
    users: { create: true, read: true, update: true, delete: true },
  },
  profile_photo: 'https://i.pravatar.cc/150?u=mockadmin',
};

export const mockStudents = Array.from({ length: 35 }, (_, i) => ({
  student_id: `EEP-${101 + i}`,
  first_name: ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia'][i % 10],
  last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][i % 10],
  date_of_birth: `${2010 + (i % 10)}-${(i % 12) + 1}-${(i % 28) + 1}`,
  gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
  profile_photo: `https://i.pravatar.cc/150?u=student${101+i}`,
  school: 'Hope Academy',
  current_grade: `${(i % 5) + 3}`,
  eep_enroll_date: `2020-01-15`,
  student_status: i % 5 === 0 ? StudentStatus.INACTIVE : StudentStatus.ACTIVE,
  sponsorship_status: i % 3 === 0 ? SponsorshipStatus.UNSPONSORED : SponsorshipStatus.SPONSORED,
  sponsor_name: i % 3 !== 0 ? `Sponsor ${i % 7}` : null,
}));

export const mockTransactions = Array.from({ length: 40 }, (_, i) => ({
    id: `txn_${1000 + i}`,
    date: `2024-0${Math.floor(i / 5) + 1}-${(i % 28) + 1}`,
    description: i % 2 === 0 ? 'Monthly Sponsorship Donation' : 'School Fee Payment',
    location: 'Kampala',
    amount: i % 2 === 0 ? '50.00' : '-25.00',
    type: i % 2 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
    category: i % 2 === 0 ? 'Donation' : 'School Fees',
    student_id: `EEP-${101 + (i % 10)}`,
}));

export const mockUsers = [
    { id: 1, username: 'mockadmin', email: 'admin@example.com', role: 'Administrator', status: UserStatus.ACTIVE, last_login: new Date().toISOString() },
    { id: 2, username: 'manager_sam', email: 'sam@example.com', role: 'Manager', status: UserStatus.ACTIVE, last_login: '2024-06-14T10:00:00Z' },
    { id: 3, username: 'viewer_jane', email: 'jane@example.com', role: 'Viewer', status: UserStatus.INACTIVE, last_login: '2024-05-20T12:30:00Z' },
];

export const mockStudentLookup = mockStudents.slice(0, 10).map(s => ({ student_id: s.student_id, first_name: s.first_name, last_name: s.last_name }));

export const mockSponsorLookup = [
    { id: 1, name: 'Global Outreach Inc.' },
    { id: 2, name: 'Hope Foundation' },
    { id: 3, name: 'John & Jane Doe' },
];

export const mockGroups = [
    { id: 1, name: 'Manager' },
    { id: 2, name: 'Viewer' },
    { id: 3, name: 'Accountant' },
];

export const mockRoles = mockGroups.map(g => ({
    ...g,
    permissions: {
        students: { create: g.name === 'Manager', read: true, update: g.name === 'Manager', delete: false },
        transactions: { create: g.name !== 'Viewer', read: true, update: g.name !== 'Viewer', delete: false },
    }
}));
