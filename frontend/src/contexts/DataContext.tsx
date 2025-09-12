import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../services/api.ts';
import { StudentLookup, SponsorLookup, Role } from '../types.ts';

interface DataContextType {
    studentLookup: StudentLookup[];
    sponsorLookup: SponsorLookup[];
    roles: Pick<Role, 'id' | 'name'>[];
    loading: boolean;
    error: string | null;
    refetchStudentLookup: () => void;
    refetchSponsorLookup: () => void;
    refetchRoles: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [studentLookup, setStudentLookup] = useState<StudentLookup[]>([]);
    const [sponsorLookup, setSponsorLookup] = useState<SponsorLookup[]>([]);
    const [roles, setRoles] = useState<Pick<Role, 'id' | 'name'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLookups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [studentData, sponsorData, groupsData] = await Promise.all([
                api.getStudentLookup(),
                api.getSponsorLookup(),
                api.getGroups(),
            ]);
            setStudentLookup(studentData);
            setSponsorLookup(sponsorData);
            setRoles(groupsData);
        } catch (err: any) {
            setError(err.message || 'Failed to load lookup data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const refetchStudentLookup = useCallback(async () => {
        try {
            const data = await api.getStudentLookup();
            setStudentLookup(data);
        } catch (err: any) {
            setError(err.message || 'Failed to refresh student data.');
        }
    }, []);

    const refetchSponsorLookup = useCallback(async () => {
        try {
            const data = await api.getSponsorLookup();
            setSponsorLookup(data);
        } catch (err: any) {
            setError(err.message || 'Failed to refresh sponsor data.');
        }
    }, []);

    const refetchRoles = useCallback(async () => {
        try {
            const data = await api.getGroups();
            setRoles(data);
        } catch (err: any) {
            setError(err.message || 'Failed to refresh roles data.');
        }
    }, []);

    useEffect(() => {
        fetchLookups();
    }, [fetchLookups]);
    
    const value = { studentLookup, sponsorLookup, roles, loading, error, refetchStudentLookup, refetchSponsorLookup, refetchRoles };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};