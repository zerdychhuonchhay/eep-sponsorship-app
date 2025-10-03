import React, { useState, useEffect, useRef } from 'react';
import { MenuIcon, BellIcon } from '@/components/Icons.tsx';
import NotificationCenter from '@/components/NotificationCenter.tsx';
import { useUI } from '@/contexts/UIContext.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { useOffline } from '@/contexts/OfflineContext.tsx';

const OfflineIndicator: React.FC = () => {
    const { isOnline, isSyncing, pendingChangesCount } = useOffline();

    if (isOnline) {
        if (isSyncing) {
            return <div className="text-xs font-semibold text-primary">Syncing...</div>;
        }
        if (pendingChangesCount > 0) {
            return <div className="text-xs font-semibold text-secondary">{pendingChangesCount} changes pending</div>;
        }
        return null;
    }

    return (
        <div className="text-xs font-semibold text-warning px-2 py-1 bg-warning/10 rounded">
            Offline
        </div>
    );
};


const Header: React.FC = () => {
    const { isSidebarOpen, toggleSidebar } = useUI();
    const { unreadCount } = useNotification();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                const trigger = (event.target as HTMLElement).closest('button');
                if (!trigger || trigger.id !== 'notification-trigger') {
                     setIsNotificationsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex w-full bg-white dark:bg-box-dark shadow-sm no-print">
            <div className="flex flex-grow items-center justify-between py-4 px-4 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* <!-- Hamburger Toggle BTN --> */}
                    <button
                        id="sidebar-toggle"
                        onClick={toggleSidebar}
                        className="block rounded-sm border border-stroke bg-white p-2 shadow-sm dark:border-strokedark dark:bg-box-dark"
                        aria-controls="application-sidebar"
                        aria-expanded={isSidebarOpen}
                    >
                        <MenuIcon className="w-5 h-5 text-black dark:text-white" />
                    </button>
                </div>
                
                <div className="flex items-center gap-3 2xsm:gap-7">
                     <OfflineIndicator />
                     <ul className="flex items-center gap-2 2xsm:gap-4">
                        <li className="relative" ref={notificationRef}>
                            <button 
                                id="notification-trigger" 
                                onClick={() => setIsNotificationsOpen(p => !p)} 
                                className="relative p-2 rounded-full text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2"
                            >
                                <BellIcon className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-danger text-white text-xs flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
                        </li>
                     </ul>
                </div>
            </div>
        </header>
    );
};

export default Header;