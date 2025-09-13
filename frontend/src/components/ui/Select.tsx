import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowDownIcon } from '../Icons.tsx';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label: string;
    options: SelectOption[];
    value: string;
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
    const [highlightedIndex, setHighlightedIndex] = useState(options.findIndex(opt => opt.value === value));
    const searchStringRef = useRef('');
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // This assumes the label is unique enough on the page to generate a unique ID.
    const baseId = `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const buttonId = `${baseId}-button`;
    const labelId = `${baseId}-label`;
    const listboxId = `${baseId}-listbox`;
    const getOptionId = (index: number) => `${baseId}-option-${index}`;

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

    // Effect to handle closing on outside click
    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen]);

    // Effect to reset highlight when opening/closing
    useEffect(() => {
        if (isOpen) {
            calculatePosition();
            setHighlightedIndex(options.findIndex(opt => opt.value === value));
        }
    }, [isOpen, options, value]);
    
    // Effect to scroll the highlighted item into view
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0) {
            const optionElement = document.getElementById(getOptionId(highlightedIndex));
            optionElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [isOpen, highlightedIndex]);

    // Effect to handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handler = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (highlightedIndex !== -1 && options[highlightedIndex]) {
                        onChange(options[highlightedIndex].value);
                    }
                    setIsOpen(false);
                    buttonRef.current?.focus();
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsOpen(false);
                    buttonRef.current?.focus();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(prev => (prev + 1) % options.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(prev => (prev - 1 + options.length) % options.length);
                    break;
                case 'Home':
                    e.preventDefault();
                    setHighlightedIndex(0);
                    break;
                case 'End':
                    e.preventDefault();
                    setHighlightedIndex(options.length - 1);
                    break;
                default:
                    if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) {
                        e.preventDefault();
                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                        searchStringRef.current += e.key.toLowerCase();
                        searchTimeoutRef.current = setTimeout(() => { searchStringRef.current = ''; }, 500);
                        const searchIndex = options.findIndex(opt => opt.label.toLowerCase().startsWith(searchStringRef.current));
                        if (searchIndex !== -1) setHighlightedIndex(searchIndex);
                    }
                    break;
            }
        };
        
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, highlightedIndex, options, onChange]);

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        buttonRef.current?.focus();
    };
    
    const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            setIsOpen(true);
        }
    };

    const DropdownMenu = () => (
        <div
            ref={dropdownRef}
            style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px` }}
            className="fixed max-h-60 overflow-y-auto rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark z-[9999]"
        >
            <ul className="py-1" role="listbox" id={listboxId} aria-labelledby={labelId}>
                {options.map((option, index) => (
                    <li
                        key={option.value}
                        id={getOptionId(index)}
                        onClick={() => handleOptionClick(option.value)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-4 py-2 text-sm cursor-pointer ${
                            highlightedIndex === index ? 'bg-gray-2 dark:bg-box-dark-2' : ''
                        } ${
                            value === option.value
                                ? 'font-semibold text-primary'
                                : 'text-black dark:text-white'
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
            <label id={labelId} className="mb-2 block text-black dark:text-white">{label}</label>
            <div className="relative">
                <button
                    ref={buttonRef}
                    id={buttonId}
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? listboxId : undefined}
                    aria-activedescendant={highlightedIndex !== -1 ? getOptionId(highlightedIndex) : undefined}
                    aria-labelledby={`${labelId} ${buttonId}`}
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    onKeyDown={handleButtonKeyDown}
                    disabled={disabled}
                    className={`w-full flex justify-between items-center rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary text-left ${
                        value ? 'text-black dark:text-white' : 'text-gray-400'
                    }`}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ArrowDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && ReactDOM.createPortal(<DropdownMenu />, document.body)}
            </div>
        </div>
    );
};

export default Select;
