import React from 'react';
import { ChevronRightIcon } from '@/components/Icons.tsx';

interface MobileListItemProps {
    icon?: React.ReactNode;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    rightContent?: React.ReactNode;
    onClick?: () => void;
    showChevron?: boolean;
}

const MobileListItem: React.FC<MobileListItemProps> = ({ icon, title, subtitle, rightContent, onClick, showChevron = true }) => {
    const content = (
        <div className="flex items-center gap-4 p-3">
            {icon && <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-2 dark:bg-box-dark-2 rounded-full">{icon}</div>}
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-black dark:text-white truncate">{title}</p>
                {subtitle && <p className="text-sm text-body-color dark:text-gray-400 truncate">{subtitle}</p>}
            </div>
            {rightContent && <div className="flex-shrink-0 ml-auto pl-2">{rightContent}</div>}
            {onClick && showChevron && <ChevronRightIcon className="w-5 h-5 text-body-color flex-shrink-0" />}
        </div>
    );

    const baseClasses = "w-full text-left bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-sm";

    if (onClick) {
        return (
            <button onClick={onClick} className={`${baseClasses} hover:bg-gray-2 dark:hover:bg-box-dark-2 active:bg-gray-2/50 dark:active:bg-box-dark-2/50 transition-colors`}>
                {content}
            </button>
        );
    }

    return (
        <div className={baseClasses}>
            {content}
        </div>
    );
};

export default MobileListItem;