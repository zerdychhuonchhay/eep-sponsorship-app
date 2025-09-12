import React, { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SuccessIcon, ErrorIcon } from './Icons.tsx';

const Toast: React.FC = () => {
    const { toast, hideToast } = useNotification();

    useEffect(() => {
        if (toast && toast.type === 'success') {
            const timer = setTimeout(() => {
                hideToast();
            }, 5000); // Auto-hide success messages after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [toast, hideToast]);

    if (!toast) {
        return null;
    }

    const isSuccess = toast.type === 'success';
    const bgColor = isSuccess ? 'bg-success' : 'bg-danger';
    const Icon = isSuccess ? SuccessIcon : ErrorIcon;

    return (
        <div 
            className={`fixed top-5 right-5 z-50 flex items-center px-6 py-4 rounded-lg shadow-lg text-white ${bgColor}`}
            role="alert"
        >
            <div className="mr-4">
                <Icon />
            </div>
            <span>{toast.message}</span>
            <button onClick={hideToast} className="ml-6 font-bold opacity-70 hover:opacity-100" aria-label="Close">&times;</button>
        </div>
    );
};

export default Toast;