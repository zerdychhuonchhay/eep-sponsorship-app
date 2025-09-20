import React, { useState, useEffect, useRef } from 'react';
import { MenuIcon, BugIcon } from '@/components/Icons.tsx';
import NotificationCenter from '@/components/debug/NotificationCenter.tsx';
import { useUI } from '@/contexts/UIContext.tsx';

const Header: React.FC = () => {
    const { isSidebarOpen, toggleSidebar } = useUI();
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const debugRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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
                     <ul className="flex items-center gap-2 2xsm:gap-4">
                        <li className="relative" ref={debugRef}>
                            <button id="debug-trigger" onClick={() => setIsDebugOpen(p => !p)} className="p-2 rounded-full text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                <BugIcon className="w-6 h-6" />
                            </button>
                            <NotificationCenter isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
                        </li>
                     </ul>
                </div>
            </div>
        </header>
    );
};

export default Header;