import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowDownIcon } from '../Icons.tsx';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    options: SelectOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const Select: React.FC<SelectProps> = ({ label, options, value, onChange, placeholder = 'Select an option', disabled, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number, left: number, width: number }>({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    const calculatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            calculatePosition();
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                    buttonRef.current && !buttonRef.current.contains(event.target as Node)
                ) {
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

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const DropdownMenu = () => (
        <div
            ref={dropdownRef}
            style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px` }}
            className="fixed max-h-60 overflow-y-auto rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark z-[9999]"
        >
            <ul className="py-1" role="listbox">
                {options.map((option) => (
                    <li
                        key={option.value}
                        onClick={() => handleOptionClick(option.value)}
                        className={`px-4 py-2 text-sm cursor-pointer ${
                            value === option.value
                                ? 'bg-primary text-white'
                                : 'text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2'
                        }`}
                        role="option"
                        aria-selected={value === option.value}
                    >
                        {option.label}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className={className}>
            {label && <label className="mb-2 block text-black dark:text-white">{label}</label>}
            <div className="relative">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full flex justify-between items-center rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary text-left ${
                        value ? 'text-black dark:text-white' : 'text-gray-400'
                    }`}
                >
                    <span>{selectedLabel}</span>
                    <ArrowDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && ReactDOM.createPortal(<DropdownMenu />, document.body)}
            </div>
        </div>
    );
};

export default Select;