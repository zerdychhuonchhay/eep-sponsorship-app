import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface UIContextType {
    isBulkActionBarVisible: boolean;
    setIsBulkActionBarVisible: (isVisible: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isBulkActionBarVisible, setIsBulkActionBarVisible] = useState(false);

    const value = useMemo(() => ({
        isBulkActionBarVisible,
        setIsBulkActionBarVisible,
    }), [isBulkActionBarVisible]);

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
