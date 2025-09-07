import React, { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { SuccessIcon, ErrorIcon, CloseIcon } from './Icons';

const Toast: React.FC = () => {
    const { toast, hideToast } = useNotification();

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                hideToast();
            }, 5000); // Auto-dismiss after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [toast, hideToast]);

    if (!toast) return null;

    const isSuccess = toast.type === 'success';
    const bgColor = isSuccess ? 'bg-success' : 'bg-danger';
    const icon = isSuccess ? <SuccessIcon /> : <ErrorIcon />;

    return (
        <div
            className={`fixed top-5 right-5 z-50 flex items-center justify-between w-full max-w-sm p-4 text-white rounded-lg shadow-lg ${bgColor} transform transition-transform duration-300 ease-in-out ${toast ? 'translate-x-0' : 'translate-x-full'}`}
            role="alert"
        >
            <div className="flex items-center gap-3">
                {icon}
                <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button onClick={hideToast} className="p-1 rounded-full hover:bg-white/20" aria-label="Dismiss">
                <CloseIcon />
            </button>
        </div>
    );
};

export default Toast;
