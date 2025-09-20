import React, { useState, useRef, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';
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
    const [position, setPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const calculatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX - 160 + rect.width, // 160 is width of menu
            });
        }
    };
    
    useEffect(() => {
        if (isOpen) {
            calculatePosition();
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                    buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', calculatePosition, true);
            window.addEventListener('resize', calculatePosition);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                window.removeEventListener('scroll', calculatePosition, true);
                window.removeEventListener('resize', calculatePosition);
            };
        }
    }, [isOpen]);

    const handleItemClick = (onClick: () => void) => {
        onClick();
        setIsOpen(false);
    };
    
    const DropdownMenu = () => (
        <div 
            ref={dropdownRef}
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            className="fixed w-40 rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark z-50"
        >
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
    );

    return (
        <div className="relative inline-block">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="hover:text-primary p-2 rounded-full hover:bg-gray dark:hover:bg-box-dark-2"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <DotsVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && ReactDOM.createPortal(<DropdownMenu />, document.body)}
        </div>
    );
};

export default ActionDropdown;