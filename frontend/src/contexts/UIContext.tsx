import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

interface UIContextType {
    isBulkActionBarVisible: boolean;
    setIsBulkActionBarVisible: (isVisible: boolean) => void;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isBulkActionBarVisible, setIsBulkActionBarVisible] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('sidebar-collapsed', String(newState));
            return newState;
        });
    }, []);


    const value = useMemo(() => ({
        isBulkActionBarVisible,
        setIsBulkActionBarVisible,
        isSidebarCollapsed,
        toggleSidebar,
    }), [isBulkActionBarVisible, isSidebarCollapsed, toggleSidebar]);

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};