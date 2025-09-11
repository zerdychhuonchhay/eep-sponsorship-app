import { useEffect } from 'react';
import { useDebugNotification } from '@/contexts/DebugNotificationContext.tsx';

const DebugEventLogger = () => {
    const { logEvent } = useDebugNotification();

    useEffect(() => {
        const handleLog = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { message, type, duration } = customEvent.detail;
            logEvent(message, type, duration);
        };

        window.addEventListener('debug-log', handleLog);
        return () => {
            window.removeEventListener('debug-log', handleLog);
        };
    }, [logEvent]);

    return null; // This component doesn't render anything
};

export default DebugEventLogger;
