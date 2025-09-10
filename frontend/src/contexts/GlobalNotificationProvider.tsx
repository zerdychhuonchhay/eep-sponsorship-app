import React from 'react';
import { NotificationProvider } from './NotificationContext.tsx';
import { DebugNotificationProvider } from './DebugNotificationContext.tsx';

export const GlobalNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <DebugNotificationProvider>
            <NotificationProvider>
                {children}
            </NotificationProvider>
        </DebugNotificationProvider>
    );
};
