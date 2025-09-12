import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDebugNotification, DebugNotification, DebugNotificationType } from '@/contexts/DebugNotificationContext.tsx';
import { CopyIcon, ErrorIcon, SuccessIcon } from '@/components/Icons.tsx';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const { notifications, clearNotifications, markAllAsRead } = useDebugNotification();
    const [showAll, setShowAll] = useState(false);
    const prevIsOpen = useRef(isOpen);

    useEffect(() => {
        // When the panel transitions from open to closed, mark all notifications as read.
        if (prevIsOpen.current && !isOpen) {
            markAllAsRead();
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, markAllAsRead]);


    const typeClasses: Record<DebugNotificationType, { bg: string, text: string, icon: React.ReactNode }> = {
        api_success: { bg: 'bg-success/10', text: 'text-success', icon: <SuccessIcon /> },
        api_error: { bg: 'bg-danger/10', text: 'text-danger', icon: <ErrorIcon /> },
        error: { bg: 'bg-danger/10', text: 'text-danger', icon: <ErrorIcon /> },
        info: { bg: 'bg-primary/10', text: 'text-primary', icon: 'ℹ️' },
    };

    const handleCopy = (notif: DebugNotification) => {
        const textToCopy = `[${notif.timestamp.toISOString()}] [${notif.type.toUpperCase()}]\nMessage: ${notif.message}\n${notif.duration ? `Duration: ${notif.duration}ms` : ''}`;
        navigator.clipboard.writeText(textToCopy);
    };

    const filteredNotifications = useMemo(() => {
        if (showAll) return notifications;
        return notifications.filter(n => n.type === 'api_error' || n.type === 'error');
    }, [notifications, showAll]);

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 mt-2 w-96 rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-box-dark z-50">
            <div className="flex items-center justify-between py-3 px-4.5 border-b border-stroke dark:border-strokedark">
                <h4 className="text-sm font-semibold text-black dark:text-white">Debug Notifications</h4>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={showAll} onChange={() => setShowAll(p => !p)} className="form-checkbox h-3.5 w-3.5 rounded-sm" />
                        Show All
                    </label>
                    <button onClick={clearNotifications} className="text-xs text-primary hover:underline">Clear</button>
                </div>
            </div>

            <div className="flex h-96 flex-col overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-body-color">{showAll ? 'No notifications yet.' : 'No errors to show.'}</p>
                    </div>
                ) : (
                    filteredNotifications.map(notif => (
                        <div key={notif.id} className={`flex items-start gap-2.5 py-3 px-4.5 hover:bg-gray-2 dark:hover:bg-box-dark-2 border-b border-stroke dark:border-strokedark ${!notif.isRead ? 'bg-primary/5' : ''}`}>
                            <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${typeClasses[notif.type].bg}`}>
                                <span className={typeClasses[notif.type].text}>{typeClasses[notif.type].icon}</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-black dark:text-white break-words">
                                    {notif.message} {notif.duration && <span className="text-xs text-body-color">({notif.duration}ms)</span>}
                                </p>
                                <p className="text-xs text-body-color">{notif.timestamp.toLocaleTimeString()}</p>
                            </div>
                             {(notif.type === 'api_error' || notif.type === 'error') && (
                                <button onClick={() => handleCopy(notif)} className="p-1 text-body-color hover:text-primary" title="Copy for debug">
                                    <CopyIcon />
                                </button>
                            )}
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