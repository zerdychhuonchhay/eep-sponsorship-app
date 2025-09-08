import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { MenuIcon, MoonIcon, SunIcon, BellIcon } from '@/components/Icons.tsx';
import { useDebugNotification } from '@/contexts/DebugNotificationContext.tsx';
import NotificationCenter from '@/components/debug/NotificationCenter.tsx';

interface HeaderProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
    const { unreadErrorCount, hasUnreadErrors, markAllAsRead, logEvent } = useDebugNotification();

    useEffect(() => {
        const handleApiRequestStart = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            sessionStorage.setItem(`api-request-start-${detail.requestId}`, Date.now().toString());
        };

        const handleApiRequestEnd = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const startTime = sessionStorage.getItem(`api-request-start-${detail.requestId}`);
            sessionStorage.removeItem(`api-request-start-${detail.requestId}`);
            const duration = startTime ? Date.now() - parseInt(startTime, 10) : undefined;
            
            const message = `${detail.method.toUpperCase()} ${detail.endpoint} - Status: ${detail.status}`;
            const type = detail.ok ? 'api_success' : 'api_error';
            logEvent(message, type, duration);
        };
        
        const handleError = (event: ErrorEvent) => {
            logEvent(`Unhandled Error: ${event.message} in ${event.filename}:${event.lineno}`, 'error');
        };

        const handlePromiseRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
            logEvent(`Unhandled Promise Rejection: ${reason}`, 'error');
        };

        window.addEventListener('api-request-start', handleApiRequestStart);
        window.addEventListener('api-request-end', handleApiRequestEnd);
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handlePromiseRejection);

        return () => {
            window.removeEventListener('api-request-start', handleApiRequestStart);
            window.removeEventListener('api-request-end', handleApiRequestEnd);
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handlePromiseRejection);
        };
    }, [logEvent]);

    useEffect(() => {
        if (hasUnreadErrors && !isNotificationCenterOpen) {
            setIsNotificationCenterOpen(true);
            markAllAsRead(); // Mark as read when auto-opening
        }
    }, [hasUnreadErrors, isNotificationCenterOpen, markAllAsRead]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleNotificationCenter = useCallback(() => {
        setIsNotificationCenterOpen(prev => {
            if (!prev) {
                markAllAsRead();
            }
            return !prev;
        });
    }, [markAllAsRead]);

    return (
        <header className="sticky top-0 z-20 flex w-full bg-white dark:bg-box-dark shadow-sm no-print">
            <div className="flex flex-grow items-center justify-between py-4 px-4 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-black dark:text-white">
                        <MenuIcon />
                    </button>
                    <div className="lg:hidden">
                        <NavLink to="/" className="flex-shrink-0 flex items-center gap-2">
                            <img src="/logo.png" alt="EEP Logo" className="h-8 w-auto" />
                            <span className="font-semibold text-lg text-black dark:text-white">Education Empowerment Program</span>
                        </NavLink>
                    </div>
                </div>
                
                <div className="hidden sm:block">
                    {/* Search functionality can be implemented here */}
                </div>

                <div className="flex items-center gap-3 2xsm:gap-7">
                     <ul className="flex items-center gap-2 2xsm:gap-4">
                        <li>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-black dark:text-white">
                                {isDarkMode ? <SunIcon /> : <MoonIcon />}
                            </button>
                        </li>
                         <li className="relative">
                            <button onClick={toggleNotificationCenter} className="text-black dark:text-white relative">
                                <BellIcon />
                                {unreadErrorCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-white text-xs flex items-center justify-center">
                                        {unreadErrorCount}
                                    </span>
                                )}
                            </button>
                            <NotificationCenter isOpen={isNotificationCenterOpen} onClose={() => setIsNotificationCenterOpen(false)} />
                        </li>
                     </ul>

                     <div className="hidden lg:flex items-center gap-4">
                        <span className="text-right">
                            <span className="block text-sm font-medium text-black dark:text-white">Admin User</span>
                            <span className="block text-xs text-body-color dark:text-gray-300">Administrator</span>
                        </span>
                        <img src="https://picsum.photos/40/40" alt="Admin" className="w-10 h-10 rounded-full" />
                     </div>
                </div>
            </div>
        </header>
    );
};

export default Header;