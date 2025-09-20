import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
    return (
        <div 
            className={`rounded-lg border border-stroke bg-white shadow-md dark:border-strokedark dark:bg-box-dark ${className || ''}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

interface CardHeaderProps {
    title: string;
    children?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, children }) => {
    return (
        <div className="flex justify-between items-center border-b border-stroke py-4 px-6 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">{title}</h3>
            {children}
        </div>
    );
};

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
    return (
        <div className={`p-6 ${className || ''}`}>
            {children}
        </div>
    );
};