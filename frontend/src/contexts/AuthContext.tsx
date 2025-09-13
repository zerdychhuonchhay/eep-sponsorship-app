import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api.ts';
import { User } from '@/types.ts';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to parse JWT and get expiration time
const parseJwt = (token: string) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    // FIX: Use `ReturnType<typeof setTimeout>` for the timeout ID to ensure cross-environment compatibility (Node.js vs. browser).
    const refreshTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearRefreshTokenTimer = () => {
        if (refreshTimeoutId.current) {
            clearTimeout(refreshTimeoutId.current);
            refreshTimeoutId.current = null;
        }
    };

    const scheduleTokenRefresh = useCallback((accessToken: string) => {
        clearRefreshTokenTimer();

        const decodedToken = parseJwt(accessToken);
        if (!decodedToken || !decodedToken.exp) {
            console.error("Invalid or missing expiration in token.");
            return;
        }

        const expiresIn = (decodedToken.exp * 1000) - Date.now();
        const refreshBuffer = 60 * 1000; // Refresh 60 seconds before expiration
        const timeoutDuration = expiresIn - refreshBuffer;

        if (timeoutDuration > 0) {
            refreshTimeoutId.current = setTimeout(async () => {
                try {
                    const { accessToken: newAccessToken } = await api.refreshToken();
                    localStorage.setItem('accessToken', newAccessToken);
                    // Schedule the next refresh
                    scheduleTokenRefresh(newAccessToken);
                } catch (error) {
                    console.error("Failed to refresh token proactively.", error);
                    // The user will be logged out by the apiClient interceptor on the next API call.
                    // Or we could log out here immediately.
                    logout();
                }
            }, timeoutDuration);
        }
    }, []);

    const initAuth = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const userData = await api.getCurrentUser();
                setUser(userData);
                scheduleTokenRefresh(token);
            } catch (error) {
                // Token might be invalid/expired
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setUser(null);
            }
        }
        setIsLoading(false);
    }, [scheduleTokenRefresh]);

    useEffect(() => {
        initAuth();
        // Cleanup timer on component unmount
        return () => clearRefreshTokenTimer();
    }, [initAuth]);

    const login = async (username: string, password: string) => {
        const { accessToken, refreshToken } = await api.login(username, password);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        const userData = await api.getCurrentUser();
        setUser(userData);
        scheduleTokenRefresh(accessToken);
        navigate('/');
    };

    const logout = () => {
        setUser(null);
        clearRefreshTokenTimer();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Custom hook to check permissions for a specific application module.
 * @param module - The name of the module (e.g., 'students', 'transactions').
 * @returns An object with boolean flags for create, read, update, and delete permissions.
 */
export const usePermissions = (module: string) => {
    const { user } = useAuth();

    if (!user) {
        return { canCreate: false, canRead: false, canUpdate: false, canDelete: false };
    }

    // Admins can do everything, bypassing detailed checks.
    if (user.isAdmin) {
        return { canCreate: true, canRead: true, canUpdate: true, canDelete: true };
    }
    
    // Default to no permissions if the module is not explicitly defined for the user's role.
    const permissions = user.permissions?.[module] || { create: false, read: false, update: false, delete: false };

    return {
        canCreate: permissions.create,
        canRead: permissions.read,
        canUpdate: permissions.update,
        canDelete: permissions.delete,
    };
};