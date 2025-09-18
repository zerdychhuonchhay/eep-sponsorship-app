import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

interface UIContextType {
    isBulkActionBarVisible: boolean;
    setIsBulkActionBarVisible: (isVisible: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    toggleSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isBulkActionBarVisible, setIsBulkActionBarVisible] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);


    const value = useMemo(() => ({
        isBulkActionBarVisible,
        setIsBulkActionBarVisible,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
    }), [isBulkActionBarVisible, isSidebarOpen, toggleSidebar]);

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