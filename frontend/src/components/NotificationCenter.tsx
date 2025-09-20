import React, { useEffect, useRef } from 'react';
import { useNotification, AppNotification } from '@/contexts/NotificationContext.tsx';
import { ErrorIcon, SuccessIcon } from '@/components/Icons.tsx';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const { notifications, clearNotifications, markAllAsRead } = useNotification();
    const prevIsOpen = useRef(isOpen);

    useEffect(() => {
        // When the panel is opened, mark all notifications as read.
        if (!prevIsOpen.current && isOpen) {
            markAllAsRead();
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, markAllAsRead]);


    const typeClasses: Record<AppNotification['type'], { bg: string, text: string, icon: React.ReactNode }> = {
        success: { bg: 'bg-success/10', text: 'text-success', icon: <SuccessIcon className="w-5 h-5" /> },
        error: { bg: 'bg-danger/10', text: 'text-danger', icon: <ErrorIcon className="w-5 h-5" /> },
        info: { bg: 'bg-primary/10', text: 'text-primary', icon: <SuccessIcon className="w-5 h-5" /> },
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-box-dark z-50">
            <div className="flex items-center justify-between py-3 px-4.5 border-b border-stroke dark:border-strokedark">
                <h4 className="text-sm font-semibold text-black dark:text-white">Notifications</h4>
                <button onClick={clearNotifications} className="text-xs text-primary hover:underline">Clear All</button>
            </div>

            <div className="flex h-96 flex-col overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-body-color">No notifications yet.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className={`flex items-start gap-2.5 py-3 px-4.5 hover:bg-gray-2 dark:hover:bg-box-dark-2 border-b border-stroke dark:border-strokedark ${!notif.isRead ? 'bg-primary/5' : ''}`}>
                            <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${typeClasses[notif.type].bg}`}>
                                <span className={typeClasses[notif.type].text}>{typeClasses[notif.type].icon}</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-black dark:text-white break-words">
                                    {notif.message}
                                </p>
                                <p className="text-xs text-body-color">{notif.timestamp.toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
             <button onClick={onClose} className="w-full text-center py-2 text-sm text-primary border-t border-stroke dark:border-strokedark hover:bg-gray-2 dark:hover:bg-box-dark-2">
                Close
            </button>
        </div>
    );
};

export default NotificationCenter;
