import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { ColumnConfig, ALL_STUDENT_COLUMNS, getDefaultColumns } from '@/config/studentTableConfig.tsx';

const COLUMN_STORAGE_KEY = 'student-table-columns-order';
const AI_FEATURE_STORAGE_KEY = 'ai-features-enabled';

interface SettingsContextType {
    studentTableColumns: ColumnConfig[];
    setStudentTableColumns: (newOrderIds: string[]) => void;
    resetStudentTableColumns: () => void;
    isAiEnabled: boolean;
    setIsAiEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getColumnsFromIds = (ids: string[]): ColumnConfig[] => {
    const columnMap = new Map(ALL_STUDENT_COLUMNS.map(c => [c.id, c]));
    return ids.map(id => columnMap.get(id as any)!).filter(Boolean);
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [studentTableColumns, setStudentTableColumnsState] = useState<ColumnConfig[]>(() => {
        try {
            const savedOrderIds = localStorage.getItem(COLUMN_STORAGE_KEY);
            if (savedOrderIds) {
                return getColumnsFromIds(JSON.parse(savedOrderIds));
            }
        } catch (error) {
            console.error("Failed to parse column order from localStorage", error);
        }
        return getDefaultColumns();
    });

    const [isAiEnabled, setIsAiEnabledState] = useState<boolean>(() => {
        try {
            const savedSetting = localStorage.getItem(AI_FEATURE_STORAGE_KEY);
            // Default to true if not set
            return savedSetting === null ? true : JSON.parse(savedSetting);
        } catch (error) {
            console.error("Failed to parse AI feature setting from localStorage", error);
            return true;
        }
    });

    const setStudentTableColumns = useCallback((newOrderIds: string[]) => {
        try {
            localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(newOrderIds));
            setStudentTableColumnsState(getColumnsFromIds(newOrderIds));
        } catch (error) {
            console.error("Failed to save column order to localStorage", error);
        }
    }, []);

    const resetStudentTableColumns = useCallback(() => {
        localStorage.removeItem(COLUMN_STORAGE_KEY);
        setStudentTableColumnsState(getDefaultColumns());
    }, []);

    const setIsAiEnabled = useCallback((enabled: boolean) => {
        try {
            localStorage.setItem(AI_FEATURE_STORAGE_KEY, JSON.stringify(enabled));
            setIsAiEnabledState(enabled);
        } catch (error) {
            console.error("Failed to save AI feature setting to localStorage", error);
        }
    }, []);

    const value = useMemo(() => ({
        studentTableColumns,
        setStudentTableColumns,
        resetStudentTableColumns,
        isAiEnabled,
        setIsAiEnabled,
    }), [studentTableColumns, setStudentTableColumns, resetStudentTableColumns, isAiEnabled, setIsAiEnabled]);

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