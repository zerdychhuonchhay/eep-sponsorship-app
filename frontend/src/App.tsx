import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage.tsx';
import StudentsPage from '@/pages/StudentsPage.tsx';
import TransactionsPage from '@/pages/TransactionsPage.tsx';
import FilingsPage from '@/pages/FilingsPage.tsx';
import AcademicsPage from '@/pages/AcademicsPage.tsx';
import TasksPage from '@/pages/TasksPage.tsx';
import { DataProvider } from '@/contexts/DataContext.tsx';
import { UIProvider } from '@/contexts/UIContext.tsx';
import Toast from '@/components/Toast.tsx';
import Header from '@/components/layout/Header.tsx';
import Sidebar from '@/components/layout/Sidebar.tsx';
import { SkeletonTable } from './components/SkeletonLoader.tsx';
import AIAssistant from './components/AIAssistant.tsx';
import { GlobalNotificationProvider } from './contexts/GlobalNotificationProvider.tsx';
import DebugEventLogger from './components/debug/DebugEventLogger.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SettingsProvider } from './contexts/SettingsContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import SignupPage from './pages/SignupPage.tsx';

const AuditLogPage = React.lazy(() => import('@/pages/AuditLogPage.tsx'));
const SponsorsPage = React.lazy(() => import('@/pages/SponsorsPage.tsx'));
const SponsorDetailPage = React.lazy(() => import('@/pages/SponsorDetailPage.tsx'));
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage.tsx'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage.tsx'));
const UserManagementPage = React.lazy(() => import('@/pages/UserManagementPage.tsx'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage.tsx'));

const AppContent: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen}
            />
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-gray-2 dark:bg-box-dark-2">
                <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <main>
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                        <Routes>
                            <Route index element={<DashboardPage />} />
                            <Route path="students" element={<StudentsPage />} />
                            <Route path="transactions" element={<TransactionsPage />} />
                            <Route path="filings" element={<FilingsPage />} />
                            <Route path="tasks" element={<TasksPage />} />
                            <Route path="academics" element={<AcademicsPage />} />
                             <Route path="sponsors" element={
                                <React.Suspense fallback={<SkeletonTable rows={15} cols={5} />}>
                                    <SponsorsPage />
                                </React.Suspense>
                            } />
                            <Route path="sponsors/:id" element={
                                <React.Suspense fallback={<SkeletonTable rows={15} cols={5} />}>
                                    <SponsorDetailPage />
                                </React.Suspense>
                            } />
                             <Route path="reports" element={
                                <React.Suspense fallback={<SkeletonTable rows={5} cols={1} />}>
                                    <ReportsPage />
                                </React.Suspense>
                            } />
                            <Route path="audit" element={
                                <React.Suspense fallback={<SkeletonTable rows={15} cols={5} />}>
                                    <AuditLogPage />
                                </React.Suspense>
                            } />
                             <Route path="users" element={
                                <React.Suspense fallback={<SkeletonTable rows={10} cols={5} />}>
                                    <UserManagementPage />
                                </React.Suspense>
                            } />
                             <Route path="settings" element={
                                <React.Suspense fallback={<SkeletonTable rows={5} cols={1} />}>
                                    <SettingsPage />
                                </React.Suspense>
                            } />
                            <Route path="profile" element={
                                <React.Suspense fallback={<SkeletonTable rows={5} cols={1} />}>
                                    <ProfilePage />
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
        <ThemeProvider>
            <UIProvider>
                <GlobalNotificationProvider>
                    <AuthProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route element={<ProtectedRoute />}>
                                <Route
                                    path="/*"
                                    element={
                                        <DataProvider>
                                            <SettingsProvider>
                                                <AppContent />
                                            </SettingsProvider>
                                        </DataProvider>
                                    }
                                />
                            </Route>
                        </Routes>
                        <Toast />
                        <DebugEventLogger />
                    </AuthProvider>
                </GlobalNotificationProvider>
            </UIProvider>
        </ThemeProvider>
    </HashRouter>
);

export default App;