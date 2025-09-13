import { useState, useCallback, useMemo } from 'react';
import { SortConfig } from '../types.ts';

interface UseTableControlsProps<T> {
    initialSortConfig: SortConfig<T>;
    initialFilters?: Record<string, string>;
}

export const useTableControls = <T>({ initialSortConfig, initialFilters = {} }: UseTableControlsProps<T>) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialSortConfig);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

    const handleSort = useCallback((key: keyof T | string) => {
        setSortConfig(prev => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc',
        }));
        setCurrentPage(1); // Reset to first page on sort change
    }, []);
    
    const handleFilterChange = useCallback((filterName: string, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (value === '' || value === 'all' || value === 'All') {
                delete newFilters[filterName];
            } else {
                newFilters[filterName] = value;
            }
            return newFilters;
        });
        setCurrentPage(1);
    }, []);

    const applyFilters = useCallback((newFilterValues: Record<string, string>) => {
        const activeFilters: Record<string, string> = {};
        for (const key in newFilterValues) {
            const value = newFilterValues[key];
            if (value && value !== 'all' && value !== 'All') {
                activeFilters[key] = value;
            }
        }
        setFilters(activeFilters);
        setCurrentPage(1);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(1);
    }, []);

    const apiQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.append('page', String(currentPage));
        if (sortConfig.key) {
            let orderPrefix = sortConfig.order === 'desc' ? '-' : '';
            const camelToSnake = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            let orderingKey;

            if (sortConfig.key === 'age') {
                orderingKey = 'date_of_birth';
                // To sort by age ascending (youngest first), we need to sort date_of_birth descending (newest first).
                // To sort by age descending (oldest first), we need to sort date_of_birth ascending (oldest first).
                // So we flip the sort order for the backend.
                orderPrefix = sortConfig.order === 'asc' ? '-' : '';
            } else if (sortConfig.key === 'studentName') {
                orderingKey = 'student__first_name';
            } else {
                orderingKey = camelToSnake(String(sortConfig.key));
            }
            
            params.append('ordering', `${orderPrefix}${orderingKey}`);
        }
        if (searchTerm) {
            params.append('search', searchTerm);
        }
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                params.append(key, value);
            }
        });
        return params.toString();
    }, [currentPage, sortConfig, searchTerm, filters]);

    return {
        sortConfig,
        currentPage,
        searchTerm,
        filters,
        apiQueryString,
        handleSort,
        setCurrentPage,
        setSearchTerm,
        handleFilterChange,
        applyFilters,
        clearFilters,
    };
};
