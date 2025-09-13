import React, { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SuccessIcon, ErrorIcon } from './Icons.tsx';

const Toast: React.FC = () => {
    const { toast, hideToast } = useNotification();

    useEffect(() => {
        if (toast && (toast.type === 'success' || toast.type === 'info')) {
            const timer = setTimeout(() => {
                hideToast();
            }, 5000); // Auto-hide success/info messages after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [toast, hideToast]);

    if (!toast) {
        return null;
    }

    const typeStyles: Record<string, { bg: string; icon: React.ReactNode }> = {
        success: { bg: 'bg-success', icon: <SuccessIcon /> },
        error: { bg: 'bg-danger', icon: <ErrorIcon /> },
        info: { bg: 'bg-primary', icon: <SuccessIcon /> }, // Using SuccessIcon for info as well for visual consistency
    };

    const styles = typeStyles[toast.type] || typeStyles.info;

    return (
        <div 
            className={`fixed top-5 right-5 z-50 flex items-center px-6 py-4 rounded-lg shadow-lg text-white ${styles.bg}`}
            role="alert"
        >
            <div className="mr-4">
                {styles.icon}
            </div>
            <span>{toast.message}</span>
            <button onClick={hideToast} className="ml-6 font-bold opacity-70 hover:opacity-100" aria-label="Close">&times;</button>
        </div>
    );
};

export default Toast;