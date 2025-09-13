import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DashboardIcon, StudentsIcon, TransactionsIcon, FilingsIcon, ReportsIcon, TasksIcon, AuditIcon, SponsorIcon, AcademicsIcon, SettingsIcon, UsersIcon, ChevronDoubleLeftIcon, ProfileIcon } from '@/components/Icons.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import { useUI } from '@/contexts/UIContext.tsx';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavLinkItem: React.FC<{ item: any; isCollapsed: boolean }> = ({ item, isCollapsed }) => {
    const location = useLocation();
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

    const linkClasses = `group relative flex items-center rounded-md font-medium duration-300 ease-in-out overflow-hidden ${
        isActive
            ? 'bg-primary text-white'
            : 'text-gray-400 hover:bg-white/10 hover:text-white' // Increased contrast
    } ${
        isCollapsed 
            ? 'lg:w-12 lg:h-12 lg:justify-center' // Collapsed state: square, centered icon
            : 'py-3 px-4 gap-2.5'                // Expanded state: padding and gap for text
    }`;

    return (
        <NavLink
            to={item.path}
            className={linkClasses}
        >
            {item.icon}
            {/* The text now fades and shrinks horizontally */}
            <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'lg:opacity-0 lg:max-w-0' : 'opacity-100 max-w-xs'}`}>
                {item.label}
            </span>

            {/* Tooltip for collapsed sidebar on desktop */}
            {isCollapsed && (
                <span className={`
                    absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50
                    whitespace-nowrap rounded-md bg-box-dark-2 px-3 py-1.5 text-sm font-medium text-white shadow-lg
                    invisible opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100
                    pointer-events-none
                `}>
                    {item.label}
                </span>
            )}
        </NavLink>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { isSidebarCollapsed, toggleSidebar } = useUI();
    const sidebar = useRef<any>(null);

    // close on click outside for mobile
    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
            if (!sidebar.current || !isOpen) return;
            // Don't close if the click is on the mobile toggle button
            if ((target as HTMLElement).closest('#mobile-sidebar-toggle')) {
                return;
            }
            if (!sidebar.current.contains(target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', clickHandler);
        return () => document.removeEventListener('click', clickHandler);
    }, [isOpen, setIsOpen]);

    const { canRead: canReadStudents } = usePermissions('students');
    const { canRead: canReadSponsors } = usePermissions('sponsors');
    const { canRead: canReadTransactions } = usePermissions('transactions');
    const { canRead: canReadAcademics } = usePermissions('academics');
    const { canRead: canReadTasks } = usePermissions('tasks');
    const { canRead: canReadFilings } = usePermissions('filings');
    const { canRead: canReadReports } = usePermissions('reports');
    const { canRead: canReadAudit } = usePermissions('audit');
    const { canRead: canReadUsers } = usePermissions('users');


    const navGroups = [
        {
            title: 'MENU',
            items: [
                { path: '/', label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6 flex-shrink-0" />, permission: true },
                { path: '/students', label: 'Students', icon: <StudentsIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadStudents },
                { path: '/sponsors', label: 'Sponsors', icon: <SponsorIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadSponsors },
                { path: '/transactions', label: 'Transactions', icon: <TransactionsIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadTransactions },
                { path: '/academics', label: 'Academics', icon: <AcademicsIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadAcademics },
            ]
        },
        {
            title: 'ADMINISTRATION',
            items: [
                { path: '/tasks', label: 'Tasks', icon: <TasksIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadTasks },
                { path: '/filings', label: 'Filings', icon: <FilingsIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadFilings },
                { path: '/reports', label: 'Reports', icon: <ReportsIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadReports },
                { path: '/audit', label: 'Audit Log', icon: <AuditIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadAudit },
                { path: '/users', label: 'Manage Users', icon: <UsersIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadUsers },
                { path: '/profile', label: 'My Profile', icon: <ProfileIcon className="w-6 h-6 flex-shrink-0" />, permission: true },
                { path: '/settings', label: 'Settings', icon: <SettingsIcon className="w-6 h-6 flex-shrink-0" />, permission: true },
            ]
        },
    ];

    return (
        <aside
            ref={sidebar}
            id="application-sidebar"
            className={`absolute left-0 top-0 z-40 flex h-screen w-72 flex-col overflow-y-hidden bg-box-dark duration-300 ease-linear lg:static lg:translate-x-0 no-print transition-all ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
            } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
        >
            {/* <!-- SIDEBAR HEADER --> */}
            <div className={`flex items-center gap-2 px-6 py-5.5 lg:py-6.5 transition-all duration-300 ${isSidebarCollapsed ? 'lg:justify-center lg:px-4' : 'justify-between'}`}>
                {!isSidebarCollapsed && (
                    <NavLink to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-auto flex-shrink-0" />
                        <span className="text-white text-xl font-bold whitespace-nowrap">
                            Dashboard
                        </span>
                    </NavLink>
                )}
                
                {/* Desktop collapse/expand button */}
                <button
                    id="desktop-sidebar-toggle"
                    onClick={toggleSidebar}
                    className="hidden lg:block text-gray-400 hover:text-white"
                    aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {/* <!-- SIDEBAR HEADER --> */}


            <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                <nav className="mt-5 py-4">
                    {navGroups.map((group, index) => {
                        const visibleItems = group.items.filter(item => item.permission);
                        if (visibleItems.length === 0) return null;

                        return (
                            <React.Fragment key={group.title}>
                                <div>
                                    <h3 className={`mb-4 ml-4 text-sm font-semibold text-gray-300 whitespace-nowrap transition-opacity ${isSidebarCollapsed ? 'lg:opacity-0 lg:hidden' : 'lg:px-2'}`}>
                                        {group.title}
                                    </h3>
                                    <ul className={`mb-2 flex flex-col items-center lg:items-stretch gap-1.5 ${isSidebarCollapsed ? 'lg:px-4' : 'lg:px-6'}`}>
                                        {visibleItems.map(item => (
                                            <li key={item.path}>
                                                <NavLinkItem item={item} isCollapsed={isSidebarCollapsed} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* Divider between groups */}
                                {index < navGroups.length - 1 && (
                                    <div className={`my-4 mx-4 border-t border-gray-700 transition-opacity duration-300 ${isSidebarCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'}`}></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;