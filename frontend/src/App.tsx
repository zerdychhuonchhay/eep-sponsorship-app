import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
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
import AIAssistant from './components/AIAssistant.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from '@/contexts/AuthContext.tsx';
import { SettingsProvider } from './contexts/SettingsContext.tsx';
import { OfflineProvider } from './contexts/OfflineContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import SignupPage from './pages/SignupPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import AuditLogPage from '@/pages/AuditLogPage.tsx';
import SponsorsPage from '@/pages/SponsorsPage.tsx';
import SponsorDetailPage from '@/pages/SponsorDetailPage.tsx';
import ReportsPage from '@/pages/ReportsPage.tsx';
import SettingsPage from '@/pages/SettingsPage.tsx';
import UsersAndRolesPage from '@/pages/UserManagementPage.tsx';
import ProfilePage from '@/pages/ProfilePage.tsx';

const AppContent: React.FC = () => {
    const location = useLocation();
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-gray-2 dark:bg-box-dark-2">
                <Header />
                <main>
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                        <TransitionGroup>
                            <CSSTransition
                                key={location.pathname}
                                classNames="page-fade"
                                timeout={300}
                            >
                                <Routes location={location}>
                                    <Route index element={<DashboardPage />} />
                                    <Route path="students" element={<StudentsPage />} />
                                    <Route path="transactions" element={<TransactionsPage />} />
                                    <Route path="filings" element={<FilingsPage />} />
                                    <Route path="tasks" element={<TasksPage />} />
                                    <Route path="academics" element={<AcademicsPage />} />
                                     <Route path="sponsors" element={<SponsorsPage />} />
                                    <Route path="sponsors/:id" element={<SponsorDetailPage />} />
                                     <Route path="reports" element={<ReportsPage />} />
                                    <Route path="audit" element={<AuditLogPage />} />
                                     <Route path="users" element={<UsersAndRolesPage />} />
                                     <Route path="settings" element={<SettingsPage />} />
                                    <Route path="profile" element={<ProfilePage />} />
                                </Routes>
                            </CSSTransition>
                        </TransitionGroup>
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
            <NotificationProvider>
                <UIProvider>
                    <AuthProvider>
                        <OfflineProvider>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/signup" element={<SignupPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordPage />} />
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
                        </OfflineProvider>
                    </AuthProvider>
                </UIProvider>
            </NotificationProvider>
        </ThemeProvider>
    </HashRouter>
);

export default App;