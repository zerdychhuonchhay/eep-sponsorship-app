import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export type DebugNotificationType = 'api_success' | 'api_error' | 'error' | 'info';

export interface DebugNotification {
    id: number;
    message: string;
    type: DebugNotificationType;
    timestamp: Date;
    isRead: boolean;
    duration?: number;
}

interface DebugNotificationContextType {
    notifications: DebugNotification[];
    unreadErrorCount: number;
    hasUnreadErrors: boolean;
    logEvent: (message: string, type: DebugNotificationType, duration?: number) => void;
    clearNotifications: () => void;
    markAllAsRead: () => void;
}

const DebugNotificationContext = createContext<DebugNotificationContextType | undefined>(undefined);

export const DebugNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<DebugNotification[]>([]);
    const [hasUnreadErrors, setHasUnreadErrors] = useState(false);

    const logEvent = useCallback((message: string, type: DebugNotificationType, duration?: number) => {
        const newNotification: DebugNotification = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date(),
            isRead: false,
            duration,
        };
        if (type === 'api_error' || type === 'error') {
            setHasUnreadErrors(true);
        }
        setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep last 100
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setHasUnreadErrors(false);
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setHasUnreadErrors(false);
    }, []);

    const unreadErrorCount = useMemo(() => {
        return notifications.filter(n => !n.isRead && (n.type === 'api_error' || n.type === 'error')).length;
    }, [notifications]);

    const value = useMemo(() => ({
        notifications,
        unreadErrorCount,
        hasUnreadErrors,
        logEvent,
        clearNotifications,
        markAllAsRead,
    }), [notifications, unreadErrorCount, hasUnreadErrors, logEvent, clearNotifications, markAllAsRead]);

    return (
        <DebugNotificationContext.Provider value={value}>
            {children}
        </DebugNotificationContext.Provider>
    );
};

export const useDebugNotification = (): DebugNotificationContextType => {
    const context = useContext(DebugNotificationContext);
    if (!context) {
        throw new Error('useDebugNotification must be used within a DebugNotificationProvider');
    }
    return context;
};