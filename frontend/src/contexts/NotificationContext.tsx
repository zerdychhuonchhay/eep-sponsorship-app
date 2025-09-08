import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

type ToastType = 'success' | 'error';

interface ToastMessage {
    message: string;
    type: ToastType;
}

interface NotificationContextType {
    toast: ToastMessage | null;
    showToast: (message: string, type: ToastType) => void;
    hideToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastMessage | null>(null);

    const showToast = useCallback((message: string, type: ToastType) => {
        setToast({ message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const value = useMemo(() => ({ toast, showToast, hideToast }), [toast, showToast, hideToast]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};