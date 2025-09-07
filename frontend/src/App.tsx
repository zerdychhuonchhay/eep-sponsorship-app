import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage.tsx';
import StudentsPage from './pages/StudentsPage.tsx';
import TransactionsPage from './pages/TransactionsPage.tsx';
import FilingsPage from './pages/FilingsPage.tsx';
import AcademicsPage from './pages/AcademicsPage.tsx';
import TasksPage from './pages/TasksPage.tsx';
import { DashboardIcon, StudentsIcon, TransactionsIcon, FilingsIcon, ReportsIcon, TasksIcon, MenuIcon, MoonIcon, SunIcon, LogoIcon, SearchIcon, BellIcon, ArrowDownIcon, LogoutIcon, CloseIcon } from './components/Icons.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import Toast from './components/Toast.tsx';
import { api } from './services/api.ts';

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);
    
    const navItems = [
        { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
        { path: '/students', label: 'Students', icon: <StudentsIcon /> },
        { path: '/transactions', label: 'Transactions', icon: <TransactionsIcon /> },
        { path: '/filings', label: 'Filings', icon: <FilingsIcon /> },
        { path: '/tasks', label: 'Tasks', icon: <TasksIcon /> },
        { path: '/academics', label: 'Academics', icon: <ReportsIcon /> },
    ];

    const Header = () => {
        return (
            <header className="sticky top-0 z-20 flex w-full bg-white dark:bg-box-dark shadow-sm no-print">
                <div className="flex flex-grow items-center justify-between py-4 px-4 md:px-6 2xl:px-11">
                    <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-black dark:text-white">
                            <MenuIcon />
                        </button>
                        <NavLink to="/" className="flex-shrink-0 flex items-center gap-2">
                             <LogoIcon />
                             <span className="font-bold text-xl text-black dark:text-white">NGO Admin</span>
                        </NavLink>
                    </div>
                    
                    <div className="hidden sm:block">
                        <form>
                            <div className="relative">
                                <span className="absolute top-1/2 left-0 -translate-y-1/2">
                                    <SearchIcon />
                                </span>
                                <input type="text" placeholder="Type to search..." className="w-full bg-gray-2 dark:bg-form-input rounded-md py-2 pr-4 pl-9 focus:outline-none text-black dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-400" />
                            </div>
                        </form>
                    </div>

                    <div className="flex items-center gap-3 2xsm:gap-7">
                         <ul className="flex items-center gap-2 2xsm:gap-4">
                            <li>
                                <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-black dark:text-white">
                                    {isDarkMode ? <SunIcon /> : <MoonIcon />}
                                </button>
                            </li>
                             <li>
                                <button className="text-black dark:text-white relative">
                                    <BellIcon />
                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-white text-xs flex items-center justify-center">2</span>
                                </button>
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

    const Sidebar = () => {
        return (
            <aside className={`absolute left-0 top-0 z-30 flex h-screen w-72 flex-col overflow-y-hidden bg-black dark:bg-box-dark duration-300 ease-linear lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
                <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                    <NavLink to="/" className="flex items-center gap-2">
                        <LogoIcon />
                        <span className="font-bold text-2xl text-white">NGO Admin</span>
                    </NavLink>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
                    <nav className="mt-5 py-4 px-4 lg:px-6">
                         <div>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-body-color uppercase">MENU</h3>
                            <ul className="mb-6 flex flex-col gap-1.5">
                                {navItems.map(item => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={({ isActive }) =>
                                                `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium duration-300 ease-in-out hover:bg-gray-700 dark:hover:bg-box-dark-2 ${
                                                    isActive ? 'bg-primary text-white' : 'text-body-color dark:text-gray-300'
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
                    </nav>
                </div>
                 <div className="px-6 py-4 mt-auto">
                    <button className="group relative flex w-full items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-body-color duration-300 ease-in-out hover:bg-gray-700 dark:hover:bg-box-dark-2">
                        <LogoutIcon />
                        Log Out
                    </button>
                </div>
            </aside>
        );
    };

    return (
        <HashRouter>
            <NotificationProvider>
                <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                        <Header />
                        <main>
                            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                                <Routes>
                                    <Route path="/" element={<DashboardPage />} />
                                    <Route path="/students" element={<StudentsPage />} />
                                    <Route path="/transactions" element={<TransactionsPage />} />
                                    <Route path="/filings" element={<FilingsPage />} />
                                    <Route path="/tasks" element={<TasksPage />} />
                                    <Route path="/academics" element={<AcademicsPage />} />
                                </Routes>
                            </div>
                        </main>
                    </div>
                </div>
                <Toast />
            </NotificationProvider>
        </HashRouter>
    );
};

export default App;