import { useState, useEffect, useCallback, useRef } from 'react';
import { PaginatedResponse } from '@/types.ts';

interface UsePaginatedDataOptions<T> {
    fetcher: (query: string) => Promise<PaginatedResponse<T>>;
    apiQueryString: string;
    currentPage: number;
    keepDataWhileRefetching?: boolean; // For mobile swipe views
}

export const usePaginatedData = <T extends { id?: any; studentId?: any; }>({
    fetcher,
    apiQueryString,
    currentPage,
    keepDataWhileRefetching = false,
}: UsePaginatedDataOptions<T>) => {
    const [data, setData] = useState<PaginatedResponse<T> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // True only on initial mount
    const [isStale, setIsStale] = useState(false);
    const [version, setVersion] = useState(0); // For manual refetching

    const staleTimeoutRef = useRef<number | null>(null);
    
    const refetch = useCallback(() => {
        setVersion(v => v + 1);
    }, []);

    // This effect handles resetting the aggregated data for mobile swipe views
    // when filters or sorting change (indicated by currentPage being reset to 1)
    useEffect(() => {
        if (currentPage === 1 && keepDataWhileRefetching) {
            setData(null);
        }
    }, [apiQueryString, keepDataWhileRefetching]);


    useEffect(() => {
        let isCancelled = false;
        
        const fetchData = async () => {
            // Set loading state immediately for the very first fetch on a view
            if (!data) {
                setIsLoading(true);
            } else {
                // For subsequent fetches, delay setting the 'stale' state to avoid flickering
                staleTimeoutRef.current = window.setTimeout(() => {
                    if (!isCancelled) setIsStale(true);
                }, 300);
            }

            try {
                const result = await fetcher(apiQueryString);
                if (isCancelled) return;

                if (keepDataWhileRefetching && currentPage > 1 && data) {
                    // Append new results for infinite scroll, avoiding duplicates
                    setData(prev => {
                        if (!prev) return result;
                        const existingIds = new Set(prev.results.map(item => item.id || item.studentId));
                        const newItems = result.results.filter(item => !existingIds.has(item.id || item.studentId));
                        return {
                            ...result,
                            results: [...prev.results, ...newItems],
                        };
                    });
                } else {
                    // Replace data for normal pagination or first page load
                    setData(result);
                }
                setError(null);
            } catch (err: any) {
                if (isCancelled) return;
                setError(err.message || 'Failed to fetch data.');
            } finally {
                if (isCancelled) return;
                setIsLoading(false);
                setIsStale(false);
                if (staleTimeoutRef.current) {
                    clearTimeout(staleTimeoutRef.current);
                }
            }
        };

        fetchData();

        // Cleanup function
        return () => {
            isCancelled = true;
            if (staleTimeoutRef.current) {
                clearTimeout(staleTimeoutRef.current);
            }
        };
    }, [apiQueryString, fetcher, keepDataWhileRefetching, version, currentPage, data]);

    return { data, error, isLoading, isStale, refetch };
};
