import React from 'react';
import { Student } from '@/types.ts';
import { calculateAge } from '@/utils/dateUtils.ts';
import Badge from '@/components/ui/Badge.tsx';

export interface ColumnConfig {
  id: keyof Student | 'age' | string;
  label: string;
  renderCell: (student: Student) => React.ReactNode;
}

export const ALL_STUDENT_COLUMNS: ColumnConfig[] = [
  {
    id: 'studentId',
    label: 'Student ID',
    renderCell: (s) => s.studentId,
  },
  {
    id: 'firstName',
    label: 'First Name',
    renderCell: (s) => s.firstName,
  },
  {
    id: 'lastName',
    label: 'Last Name',
    renderCell: (s) => s.lastName,
  },
  {
    id: 'age',
    label: 'Age',
    renderCell: (s) => calculateAge(s.dateOfBirth),
  },
  {
    id: 'gender',
    label: 'Sex',
    renderCell: (s) => s.gender,
  },
  {
    id: 'currentGrade',
    label: 'Grade',
    renderCell: (s) => s.currentGrade,
  },
  {
    id: 'guardianName',
    label: 'Guardian',
    renderCell: (s) => s.guardianName,
  },
  {
    id: 'studentStatus',
    label: 'Status',
    renderCell: (s) => <Badge type={s.studentStatus} />,
  },
  {
    id: 'sponsorshipStatus',
    label: 'Sponsorship',
    renderCell: (s) => <Badge type={s.sponsorshipStatus} />,
  },
  {
    id: 'school',
    label: 'School',
    renderCell: (s) => s.school,
  },
];

export const DEFAULT_STUDENT_COLUMNS_ORDER: (keyof Student | 'age')[] = [
  'studentId',
  'firstName',
  'lastName',
  'age',
  'gender',
  'currentGrade',
  'guardianName',
  'studentStatus',
];

export const getDefaultColumns = (): ColumnConfig[] => {
  const columnMap = new Map(ALL_STUDENT_COLUMNS.map(c => [c.id, c]));
  return DEFAULT_STUDENT_COLUMNS_ORDER.map(id => columnMap.get(id)!).filter(Boolean);
};
