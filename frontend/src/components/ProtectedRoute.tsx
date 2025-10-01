import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';

const ProtectedRoute: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-box-dark">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <ReactRouterDOM.Navigate to="/login" replace />;
    }

    return <ReactRouterDOM.Outlet />;
};

export default ProtectedRoute;