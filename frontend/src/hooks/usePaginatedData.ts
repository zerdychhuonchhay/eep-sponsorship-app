import { useState, useEffect, useCallback, useRef } from 'react';
import { PaginatedResponse } from '@/types.ts';
import { useOnlineStatus } from './useOnlineStatus.ts';
import * as db from '@/utils/db.ts';

interface UsePaginatedDataOptions<T> {
    fetcher: (query: string) => Promise<PaginatedResponse<T>>;
    apiQueryString: string;
    cacheKeyPrefix?: string; // Optional key to enable caching for a specific data type
}

export const usePaginatedData = <T>({
    fetcher,
    apiQueryString,
    cacheKeyPrefix,
}: UsePaginatedDataOptions<T>) => {
    const [data, setData] = useState<PaginatedResponse<T> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStale, setIsStale] = useState(false);
    const [version, setVersion] = useState(0);
    const isOnline = useOnlineStatus();

    const staleTimeoutRef = useRef<number | null>(null);
    const cacheKey = cacheKeyPrefix ? `${cacheKeyPrefix}-${apiQueryString}` : null;

    const refetch = useCallback(() => {
        setVersion(v => v + 1);
    }, []);

    useEffect(() => {
        let isCancelled = false;
        
        const fetchData = async () => {
            if (!data) {
                setIsLoading(true);
            }

            // 1. Try to load from cache first for instant UI response
            if (cacheKey) {
                try {
                    const cachedData = await db.get(cacheKey);
                    if (cachedData && !isCancelled) {
                        setData(cachedData);
                        // If we have cached data, we are no longer in the initial "loading" state
                        if (isLoading) setIsLoading(false);
                    }
                } catch (e) {
                    console.error("Failed to read from cache", e);
                }
            }
            
            // 2. If offline, stop here. The UI will show cached data if available.
            if (!isOnline) {
                if (isLoading) setIsLoading(false); // Ensure loading stops if offline on first load
                return;
            }

            // 3. If online, proceed to fetch from network
            staleTimeoutRef.current = window.setTimeout(() => {
                if (!isCancelled) setIsStale(true);
            }, 300);

            try {
                const result = await fetcher(apiQueryString);
                if (isCancelled) return;

                setData(result);
                setError(null);

                // 4. If caching is enabled, update the cache with fresh data
                if (cacheKey) {
                    await db.put(cacheKey, result);
                }
            } catch (err: any) {
                if (isCancelled) return;
                // If fetch fails but we have cached data, show an error but don't clear the view
                if (!data) {
                    setError(err.message || 'Failed to fetch data.');
                } else {
                    console.error("Network fetch failed, serving stale data.", err);
                }
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

        return () => {
            isCancelled = true;
            if (staleTimeoutRef.current) {
                clearTimeout(staleTimeoutRef.current);
            }
        };
    }, [apiQueryString, fetcher, version, isOnline, cacheKey]);

    return { data, error, isLoading, isStale, refetch };
};