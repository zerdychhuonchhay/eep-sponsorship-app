import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { DotsVerticalIcon } from './Icons.tsx';

interface ActionItem {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    className?: string;
}

interface ActionDropdownProps {
    items: ActionItem[];
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (onClick: () => void) => {
        onClick();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="hover:text-primary p-1 rounded-full hover:bg-gray dark:hover:bg-box-dark-2"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <DotsVerticalIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {items.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleItemClick(item.onClick)}
                                className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2 ${item.className || ''}`}
                                role="menuitem"
                            >
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionDropdown;
