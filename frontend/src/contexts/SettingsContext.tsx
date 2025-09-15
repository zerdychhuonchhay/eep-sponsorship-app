import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { ColumnConfig, ALL_STUDENT_COLUMNS, getDefaultColumns } from '@/config/studentTableConfig.tsx';

const STORAGE_KEY = 'student-table-columns-order';

interface SettingsContextType {
    studentTableColumns: ColumnConfig[];
    setStudentTableColumns: (newOrderIds: string[]) => void;
    resetStudentTableColumns: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getColumnsFromIds = (ids: string[]): ColumnConfig[] => {
    const columnMap = new Map(ALL_STUDENT_COLUMNS.map(c => [c.id, c]));
    return ids.map(id => columnMap.get(id as any)!).filter(Boolean);
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [studentTableColumns, setStudentTableColumnsState] = useState<ColumnConfig[]>(() => {
        try {
            const savedOrderIds = localStorage.getItem(STORAGE_KEY);
            if (savedOrderIds) {
                return getColumnsFromIds(JSON.parse(savedOrderIds));
            }
        } catch (error) {
            console.error("Failed to parse column order from localStorage", error);
        }
        return getDefaultColumns();
    });

    const setStudentTableColumns = useCallback((newOrderIds: string[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrderIds));
            setStudentTableColumnsState(getColumnsFromIds(newOrderIds));
        } catch (error) {
            console.error("Failed to save column order to localStorage", error);
        }
    }, []);

    const resetStudentTableColumns = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setStudentTableColumnsState(getDefaultColumns());
    }, []);

    const value = useMemo(() => ({
        studentTableColumns,
        setStudentTableColumns,
        resetStudentTableColumns,
    }), [studentTableColumns, setStudentTableColumns, resetStudentTableColumns]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};