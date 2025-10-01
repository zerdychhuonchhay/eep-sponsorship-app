import React from 'react';
import { Student } from '@/types.ts';
import { calculateAge } from '@/utils/dateUtils.ts';
import Badge from '@/components/ui/Badge.tsx';

export interface ColumnConfig {
  id: keyof Student | 'age' | string;
  label: string;
  renderCell: (student: Student) => React.ReactNode;
}

// All possible columns that can be shown.
export const ALL_STUDENT_COLUMNS: ColumnConfig[] = [
    { id: 'firstName', label: 'First Name', renderCell: (s) => s.firstName, },
    { id: 'lastName', label: 'Last Name', renderCell: (s) => s.lastName, },
    { id: 'studentId', label: 'Student ID', renderCell: (s) => s.studentId, },
    { id: 'age', label: 'Age', renderCell: (s) => calculateAge(s.dateOfBirth), },
    { id: 'gender', label: 'Gender', renderCell: (s) => s.gender, },
    { id: 'currentGrade', label: 'Grade', renderCell: (s) => s.currentGrade, },
    { id: 'school', label: 'School', renderCell: (s) => s.school || 'N/A', },
    { id: 'guardianName', label: 'Guardian', renderCell: (s) => s.guardianName || 'N/A', },
    { id: 'studentStatus', label: 'Status', renderCell: (s) => <Badge type={s.studentStatus} />, },
    { id: 'sponsorshipStatus', label: 'Sponsorship', renderCell: (s) => <Badge type={s.sponsorshipStatus} />, },
    { id: 'activeSponsorsCount', label: 'Sponsors', renderCell: (s) => s.sponsorships?.filter(sp => !sp.endDate).length || 0 },
];

// The default set of columns and their order.
export const DEFAULT_STUDENT_COLUMNS_ORDER: (keyof Student | 'age')[] = [
  'firstName',
  'lastName',
  'school',
  'currentGrade',
  'age',
  'studentStatus',
  'sponsorshipStatus',
];

export const getDefaultColumns = (): ColumnConfig[] => {
  const columnMap = new Map(ALL_STUDENT_COLUMNS.map(c => [c.id, c]));
  return DEFAULT_STUDENT_COLUMNS_ORDER.map(id => columnMap.get(id)!).filter(Boolean);
};