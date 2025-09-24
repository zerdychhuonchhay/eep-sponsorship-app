import React from 'react';

interface DataWrapperProps {
    isStale: boolean;
    children: React.ReactNode;
}

const DataWrapper: React.FC<DataWrapperProps> = ({ isStale, children }) => {
    return (
        <div className="relative">
            {isStale && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-box-dark/50 flex items-center justify-center rounded-lg">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            )}
            <div className={`transition-opacity ${isStale ? 'opacity-50' : 'opacity-100'}`}>
                {children}
            </div>
        </div>
    );
};

export default DataWrapper;
