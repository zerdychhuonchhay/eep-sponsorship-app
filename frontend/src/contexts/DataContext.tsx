import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api.ts';
import { StudentLookup, SponsorLookup } from '../types.ts';

interface DataContextType {
    studentLookup: StudentLookup[];
    sponsorLookup: SponsorLookup[];
    loading: boolean;
    error: string | null;
    refetchStudentLookup: () => void;
    refetchSponsorLookup: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [studentLookup, setStudentLookup] = useState<StudentLookup[]>([]);
    const [sponsorLookup, setSponsorLookup] = useState<SponsorLookup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLookups = async () => {
        setLoading(true);
        setError(null);
        try {
            const [studentData, sponsorData] = await Promise.all([
                api.getStudentLookup(),
                api.getSponsorLookup(),
            ]);
            setStudentLookup(studentData);
            setSponsorLookup(sponsorData);
        } catch (err: any) {
            setError(err.message || 'Failed to load lookup data.');
        } finally {
            setLoading(false);
        }
    };

    const refetchStudentLookup = async () => {
        try {
            const data = await api.getStudentLookup();
            setStudentLookup(data);
        } catch (err: any) {
            setError(err.message || 'Failed to refresh student data.');
        }
    };

    const refetchSponsorLookup = async () => {
        try {
            const data = await api.getSponsorLookup();
            setSponsorLookup(data);
        } catch (err: any) {
            setError(err.message || 'Failed to refresh sponsor data.');
        }
    };

    useEffect(() => {
        fetchLookups();
    }, []);
    
    const value = { studentLookup, sponsorLookup, loading, error, refetchStudentLookup, refetchSponsorLookup };

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