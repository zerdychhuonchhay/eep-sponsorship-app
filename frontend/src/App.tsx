import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage.tsx';
import StudentsPage from '@/pages/StudentsPage.tsx';
import TransactionsPage from '@/pages/TransactionsPage.tsx';
import FilingsPage from '@/pages/FilingsPage.tsx';
import AcademicsPage from '@/pages/AcademicsPage.tsx';
import TasksPage from '@/pages/TasksPage.tsx';
import { NotificationProvider } from '@/contexts/NotificationContext.tsx';
import { DataProvider } from '@/contexts/DataContext.tsx';
import { UIProvider } from '@/contexts/UIContext.tsx';
import Toast from '@/components/Toast.tsx';
import Header from '@/components/layout/Header.tsx';
import Sidebar from '@/components/layout/Sidebar.tsx';
import { SkeletonTable } from './components/SkeletonLoader.tsx';
import AIAssistant from './components/AIAssistant.tsx';

const AuditLogPage = React.lazy(() => import('@/pages/AuditLogPage.tsx'));
const SponsorsPage = React.lazy(() => import('@/pages/SponsorsPage.tsx'));
const SponsorDetailPage = React.lazy(() => import('@/pages/SponsorDetailPage.tsx'));
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage.tsx'));

const AppContent: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className={`relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden`}>
                <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <main>
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/students" element={<StudentsPage />} />
                            <Route path="/transactions" element={<TransactionsPage />} />
                            <Route path="/filings" element={<FilingsPage />} />
                            <Route path="/tasks" element={<TasksPage />} />
                            <Route path="/academics" element={<AcademicsPage />} />
                             <Route path="/sponsors" element={
                                <React.Suspense fallback={<SkeletonTable rows={15} cols={5} />}>
                                    <SponsorsPage />
                                </React.Suspense>
                            } />
                            <Route path="/sponsors/:id" element={
                                <React.Suspense fallback={<SkeletonTable rows={15} cols={5} />}>
                                    <SponsorDetailPage />
                                </React.Suspense>
                            } />
                             <Route path="/reports" element={
                                <React.Suspense fallback={<SkeletonTable rows={5} cols={1} />}>
                                    <ReportsPage />
                                </React.Suspense>
                            } />
                            <Route path="/audit" element={
                                <React.Suspense fallback={<SkeletonTable rows={15} cols={5} />}>
                                    <AuditLogPage />
                                </React.Suspense>
                            } />
                        </Routes>
                    </div>
                </main>
            </div>
            <AIAssistant />
        </div>
    );
};

const App: React.FC = () => (
    <HashRouter>
        <UIProvider>
            <DataProvider>
                <NotificationProvider>
                    <AppContent />
                    <Toast />
                </NotificationProvider>
            </DataProvider>
        </UIProvider>
    </HashRouter>
);

export default App;