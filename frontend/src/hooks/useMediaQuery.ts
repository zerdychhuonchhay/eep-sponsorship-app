import { useState, useEffect } from 'react';

// A custom hook to check for a media query match.
const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        
        const mediaQueryList = window.matchMedia(query);
        const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

        // Set initial state
        setMatches(mediaQueryList.matches);

        // Use the modern addEventListener method
        mediaQueryList.addEventListener('change', listener);
        
        return () => {
            mediaQueryList.removeEventListener('change', listener);
        };
    }, [query]);

    return matches;
};

export default useMediaQuery;
