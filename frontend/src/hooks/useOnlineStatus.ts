import { useState, useEffect } from 'react';

/**
 * A custom hook to track the browser's online status.
 * @returns `true` if the browser is online, `false` otherwise.
 */
export const useOnlineStatus = (): boolean => {
    // Initialize state with the current online status
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        // Event handlers to update state
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Add event listeners for online/offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup function to remove event listeners
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};
