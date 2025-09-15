import React, { useState, useEffect, useRef } from 'react';
// FIX: Switched to namespace import for react-router-dom to address module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';
import { MenuIcon, MoonIcon, SunIcon, LogoutIcon, ArrowDownIcon, BugIcon, ProfileIcon, UserIcon } from '@/components/Icons.tsx';
import NotificationCenter from '@/components/debug/NotificationCenter.tsx';
import { useTheme } from '@/contexts/ThemeContext.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useUI } from '@/contexts/UIContext.tsx';

interface HeaderProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const { isSidebarCollapsed } = useUI();
    const isDarkMode = theme === 'dark';
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debugRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (debugRef.current && !debugRef.current.contains(event.target as Node)) {
                const trigger = (event.target as HTMLElement).closest('button');
                if (!trigger || trigger.id !== 'debug-trigger') {
                     setIsDebugOpen(false);
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
                    {/* <!-- Hamburger Toggle BTN for Mobile --> */}
                    <button
                        id="mobile-sidebar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-box-dark lg:hidden"
                        aria-controls="application-sidebar"
                        aria-expanded={isSidebarOpen}
                    >
                        <MenuIcon className="w-5 h-5 text-black dark:text-white" />
                    </button>
                    {/* Logo for collapsed sidebar on desktop */}
                    {isSidebarCollapsed && (
                         <ReactRouterDOM.NavLink to="/" className="hidden lg:block">
                            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                        </ReactRouterDOM.NavLink>
                    )}
                </div>
                
                <div className="flex items-center gap-3 2xsm:gap-7">
                     <ul className="flex items-center gap-2 2xsm:gap-4">
                        <li>
                            <button onClick={() => setTheme(isDarkMode ? 'light' : 'dark')} className="text-black dark:text-white">
                                {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                            </button>
                        </li>
                        <li className="relative" ref={debugRef}>
                            <button id="debug-trigger" onClick={() => setIsDebugOpen(p => !p)} className="text-black dark:text-white">
                                <BugIcon className="w-6 h-6" />
                            </button>
                            <NotificationCenter isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
                        </li>
                     </ul>
                     
                     <div className="h-6 w-px bg-stroke dark:bg-strokedark"></div>

                     <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-4">
                            <span className="hidden text-right lg:block">
                                <span className="block text-sm font-medium text-black dark:text-white">{user?.username || 'User'}</span>
                                <span className="block text-xs text-body-color dark:text-gray-300">{user?.role || 'Viewer'}</span>
                            </span>
                            {user?.profilePhoto ? (
                                <img src={user.profilePhoto} alt="User" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                            <ArrowDownIcon className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark z-20">
                                <div className="py-1">
                                    <ReactRouterDOM.NavLink to="/profile" className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                        <ProfileIcon className="w-6 h-6" />
                                        My Profile
                                    </ReactRouterDOM.NavLink>
                                    <button onClick={logout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                        <LogoutIcon className="w-6 h-6" />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;