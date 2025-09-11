import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, StudentsIcon, TransactionsIcon, FilingsIcon, ReportsIcon, TasksIcon, CloseIcon, AuditIcon, SponsorIcon, AcademicsIcon, SettingsIcon } from '@/components/Icons.tsx';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    // Restructure nav items into logical groups for improved UI/UX
    const navGroups = [
        {
            title: 'MENU',
            items: [
                { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
                { path: '/students', label: 'Students', icon: <StudentsIcon /> },
                { path: '/transactions', label: 'Transactions', icon: <TransactionsIcon /> },
                { path: '/academics', label: 'Academics', icon: <AcademicsIcon /> },
            ]
        },
        {
            title: 'ADMINISTRATION',
            items: [
                { path: '/reports', label: 'Reports', icon: <ReportsIcon /> },
                { path: '/tasks', label: 'Tasks', icon: <TasksIcon /> },
                { path: '/filings', label: 'Filings', icon: <FilingsIcon /> },
                { path: '/sponsors', label: 'Sponsors', icon: <SponsorIcon /> },
                { path: '/audit', label: 'Audit Log', icon: <AuditIcon /> },
            ]
        },
        {
            title: 'PREFERENCES',
            items: [
                { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
            ]
        }
    ];

    return (
        <aside className={`absolute left-0 top-0 z-30 flex h-screen w-72 flex-shrink-0 flex-col overflow-y-hidden bg-white dark:bg-box-dark border-r border-stroke dark:border-strokedark duration-300 ease-linear lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
            <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                <NavLink to="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="EEP Logo" className="h-10 w-auto" />
                    <span className="font-semibold text-xl text-black dark:text-white">EEP Admin</span>
                </NavLink>
                <button onClick={() => setIsOpen(false)} className="lg:hidden text-black dark:text-white">
                    <CloseIcon />
                </button>
            </div>
            
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
                <nav className="mt-5 py-4 px-4 lg:px-6">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-body-color uppercase">{group.title}</h3>
                            <ul className="mb-6 flex flex-col gap-1.5">
                                {group.items.map(item => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            onClick={() => setIsOpen(false)} // This is mainly for mobile view
                                            className={({ isActive }) =>
                                                `group relative flex items-center gap-2.5 rounded-md py-2 px-4 font-medium duration-300 ease-in-out hover:bg-gray-2 dark:hover:bg-box-dark-2 ${
                                                    isActive ? 'bg-primary/10 text-primary' : 'text-body-color dark:text-gray-300'
                                                }`
                                            }
                                        >
                                            {item.icon}
                                            {item.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;