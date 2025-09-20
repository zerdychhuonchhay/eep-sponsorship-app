import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

type NotificationType = 'success' | 'error' | 'info';

export interface AppNotification {
    id: number;
    message: string;
    type: NotificationType;
    timestamp: Date;
    isRead: boolean;
}

interface NotificationContextType {
    toast: AppNotification | null;
    notifications: AppNotification[];
    unreadCount: number;
    showToast: (message: string, type: NotificationType) => void;
    hideToast: () => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<AppNotification | null>(null);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const showToast = useCallback((message: string, type: NotificationType) => {
        const newNotification: AppNotification = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date(),
            isRead: false,
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep last 100
        setToast(newNotification);
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);

    const value = useMemo(() => ({ 
        toast, 
        notifications, 
        unreadCount, 
        showToast, 
        hideToast, 
        markAllAsRead, 
        clearNotifications 
    }), [toast, notifications, unreadCount, showToast, hideToast, markAllAsRead, clearNotifications]);

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
