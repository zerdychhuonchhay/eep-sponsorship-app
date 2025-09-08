import React, { useState, useRef, useEffect } from 'react';
import { FormSelect } from './forms/FormControls.tsx';
import { FilterIcon } from './Icons.tsx';
import Button from './ui/Button.tsx';

export interface FilterOption {
    id: string;
    label: string;
    options: { value: string; label: string }[];
}

interface AdvancedFilterProps {
    filterOptions: FilterOption[];
    currentFilters: Record<string, string>;
    onApply: (filters: Record<string, string>) => void;
    onClear: () => void;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ filterOptions, currentFilters, onApply, onClear }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState(currentFilters);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalFilters(currentFilters);
    }, [currentFilters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleApply = () => {
        onApply(localFilters);
        setIsOpen(false);
    };
    
    const handleClear = () => {
        setLocalFilters({});
        onClear();
    };

    const handleChange = (id: string, value: string) => {
        setLocalFilters(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-box-dark py-2 px-4 font-medium text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2"
            >
                <FilterIcon />
                <span>Filter</span>
            </button>
            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute top-full right-0 mt-2 w-80 rounded-lg border border-stroke bg-white dark:bg-box-dark shadow-lg z-10 p-4"
                >
                    <h4 className="font-semibold text-black dark:text-white mb-4">Filter Options</h4>
                    <div className="space-y-4">
                        {filterOptions.map(opt => (
                            <FormSelect
                                key={opt.id}
                                label={opt.label}
                                id={opt.id}
                                name={opt.id}
                                value={localFilters[opt.id] || ''}
                                onChange={(e) => handleChange(opt.id, e.target.value)}
                            >
                                <option value="">All {opt.label}</option>
                                {opt.options.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </FormSelect>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between">
                        <button onClick={handleClear} className="text-sm text-primary hover:underline">Clear All</button>
                        <Button onClick={handleApply} size="sm">Apply</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedFilter;