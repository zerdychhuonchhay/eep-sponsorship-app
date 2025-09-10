import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { MenuIcon, MoonIcon, SunIcon, LogoutIcon, ArrowDownIcon } from '@/components/Icons.tsx';

interface HeaderProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex w-full bg-white dark:bg-box-dark shadow-sm no-print">
            <div className="flex flex-grow items-center justify-between py-4 px-4 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-black dark:text-white lg:hidden">
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
                     </ul>
                     
                     <div className="h-6 w-px bg-stroke dark:bg-strokedark"></div>

                     <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-4">
                            <span className="hidden text-right lg:block">
                                <span className="block text-sm font-medium text-black dark:text-white">Admin User</span>
                                <span className="block text-xs text-body-color dark:text-gray-300">Administrator</span>
                            </span>
                            <img src="https://picsum.photos/40/40" alt="Admin" className="w-10 h-10 rounded-full" />
                            <ArrowDownIcon className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark z-20">
                                <div className="py-1">
                                    <button className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                        <LogoutIcon />
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