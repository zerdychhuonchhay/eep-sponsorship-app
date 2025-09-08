import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage.tsx';
import StudentsPage from '@/pages/StudentsPage.tsx';
import TransactionsPage from '@/pages/TransactionsPage.tsx';
import FilingsPage from '@/pages/FilingsPage.tsx';
import AcademicsPage from '@/pages/AcademicsPage.tsx';
import TasksPage from '@/pages/TasksPage.tsx';
import { NotificationProvider } from '@/contexts/NotificationContext.tsx';
import { DebugNotificationProvider } from '@/contexts/DebugNotificationContext.tsx';
import Toast from '@/components/Toast.tsx';
import Header from '@/components/layout/Header.tsx';
import Sidebar from '@/components/layout/Sidebar.tsx';

const AppContent: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className={`relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 ease-linear ${isSidebarOpen ? 'lg:ml-72' : ''}`}>
                <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <main>
                    <div className="mx-auto max-w-screen-2xl px-4 md:px-6 2xl:px-10 py-8">
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
    );
};

const App: React.FC = () => (
    <HashRouter>
        <NotificationProvider>
            <DebugNotificationProvider>
                <AppContent />
                <Toast />
            </DebugNotificationProvider>
        </NotificationProvider>
    </HashRouter>
);

export default App;