import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { DashboardIcon, StudentsIcon, TransactionsIcon, FilingsIcon, ReportsIcon, TasksIcon, AuditIcon, SponsorIcon, AcademicsIcon, SettingsIcon, UsersIcon, UserIcon, ProfileIcon, LogoutIcon } from '@/components/Icons.tsx';
import { usePermissions, useAuth } from '@/contexts/AuthContext.tsx';
import { useUI } from '@/contexts/UIContext.tsx';
import ThemeToggle from '@/components/ui/ThemeToggle.tsx';

interface NavLinkItemProps {
    item: {
        path: string;
        label: string;
        icon: React.ReactNode;
    };
    onClick: () => void;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ item, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

    const linkClasses = `group relative flex items-center rounded-md font-medium duration-300 ease-in-out py-2 px-4 gap-2.5 ${
        isActive
            ? 'bg-primary text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-primary dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
    }`;

    return (
        <NavLink to={item.path} className={linkClasses} onClick={onClick}>
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
        </NavLink>
    );
};

const Sidebar: React.FC = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useUI();
    const { user, logout } = useAuth();
    const sidebar = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileTriggerRef = useRef<HTMLButtonElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});

    // Close sidebar on route change on mobile
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    }, [location, setIsSidebarOpen]);

    useEffect(() => {
        const body = document.body;
        if (isSidebarOpen) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = 'auto';
        }
        return () => { body.style.overflow = 'auto'; };
    }, [isSidebarOpen]);
    
    const calculateMenuPosition = useCallback(() => {
        if (profileTriggerRef.current) {
            const rect = profileTriggerRef.current.getBoundingClientRect();
            const styles: React.CSSProperties = {
                position: 'fixed',
                zIndex: 100, // Higher z-index for the profile menu
                bottom: `${window.innerHeight - rect.top + 8}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
            };
            setMenuPosition(styles);
        }
    }, []);

    useEffect(() => {
        if (isProfileMenuOpen) {
            calculateMenuPosition();
            const handleClickOutside = (event: MouseEvent) => {
                 if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node) &&
                     profileTriggerRef.current && !profileTriggerRef.current.contains(event.target as Node)) {
                     setIsProfileMenuOpen(false);
                 }
            };
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', calculateMenuPosition, true);
            window.addEventListener('resize', calculateMenuPosition);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                window.removeEventListener('scroll', calculateMenuPosition, true);
                window.removeEventListener('resize', calculateMenuPosition);
            };
        }
    }, [isProfileMenuOpen, calculateMenuPosition]);

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
                { path: '/users', label: 'Users & Roles', icon: <UsersIcon className="w-6 h-6 flex-shrink-0" />, permission: canReadUsers },
                { path: '/settings', label: 'Settings', icon: <SettingsIcon className="w-6 h-6 flex-shrink-0" />, permission: true },
            ]
        },
    ];

    return (
        <>
            <aside
                ref={sidebar}
                id="application-sidebar"
                className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col overflow-y-hidden bg-white dark:bg-box-dark duration-300 ease-in-out no-print transition-transform ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between gap-2 px-4 py-4">
                    <NavLink to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-auto flex-shrink-0" />
                        <span className="text-black dark:text-white text-xl font-bold whitespace-nowrap">Dashboard</span>
                    </NavLink>
                </div>
                <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto duration-300 ease-linear">
                    <nav className="mt-2 py-4">
                        {navGroups.map((group) => {
                            const visibleItems = group.items.filter(item => item.permission);
                            if (visibleItems.length === 0) return null;
                            return (
                                <div key={group.title}>
                                    <h3 className="mb-2 ml-4 text-sm font-semibold text-slate-500 dark:text-gray-400 whitespace-nowrap">
                                        {group.title}
                                    </h3>
                                    <ul className="mb-2 flex flex-col gap-1.5 px-4">
                                        {visibleItems.map(item => (
                                            <li key={item.path}>
                                                <NavLinkItem item={item} onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </nav>
                     <div className="mt-auto px-4 py-4">
                        <div className="flex items-center justify-between gap-2">
                             {/* Profile Trigger */}
                            <button
                                ref={profileTriggerRef}
                                onClick={() => setIsProfileMenuOpen(p => !p)}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-1"
                            >
                                 {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt="User" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <UserIcon className="w-6 h-6 text-slate-500 dark:text-gray-400" />
                                    </div>
                                )}
                                 <div className="overflow-hidden">
                                    <h4 className="font-semibold text-black dark:text-white text-left truncate">{user?.username || 'User'}</h4>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 text-left truncate">{user?.role || 'Viewer'}</p>
                                </div>
                            </button>
                            {/* Theme Toggle */}
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </aside>
            {isSidebarOpen && (
                 <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity"
                    aria-hidden="true"
                ></div>
            )}
            {isProfileMenuOpen && ReactDOM.createPortal(
                <div
                    ref={profileMenuRef}
                    style={menuPosition}
                    className="w-48 rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark"
                >
                    <div className="py-1">
                        <NavLink to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2">
                            <ProfileIcon className="w-5 h-5" />
                            My Profile
                        </NavLink>
                        <button onClick={logout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2">
                            <LogoutIcon className="w-5 h-5" />
                            Log Out
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Sidebar;