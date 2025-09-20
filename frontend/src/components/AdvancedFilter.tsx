import React, { useState, useRef, useEffect } from 'react';
import { FormSelect } from './forms/FormControls.tsx';
import { FilterIcon } from './Icons.tsx';
import Button from './ui/Button.tsx';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import Modal from './Modal.tsx';

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

const FilterFormContent: React.FC<Omit<AdvancedFilterProps, 'currentFilters'> & {
    localFilters: Record<string, string>;
    onLocalFilterChange: (id: string, value: string) => void;
    onClose: () => void;
}> = ({ filterOptions, localFilters, onLocalFilterChange, onApply, onClear, onClose }) => {
    
    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleClearAndClose = () => {
        onClear();
        onClose();
    };

    return (
        <>
            <h4 className="font-semibold text-black dark:text-white mb-4">Filter Options</h4>
            <div className="space-y-4">
                {filterOptions.map(opt => (
                    <FormSelect
                        key={opt.id}
                        label={opt.label}
                        id={`filter-${opt.id}`}
                        name={opt.id}
                        value={localFilters[opt.id] || ''}
                        onChange={(e) => onLocalFilterChange(opt.id, e.target.value)}
                    >
                        <option value="">All {opt.label}</option>
                        {opt.options.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </FormSelect>
                ))}
            </div>
            <div className="mt-4 flex justify-between">
                <button onClick={handleClearAndClose} className="text-sm text-primary hover:underline">Clear All</button>
                <Button onClick={handleApply} size="sm">Apply Filters</Button>
            </div>
        </>
    );
};

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ filterOptions, currentFilters, onApply, onClear }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState(currentFilters);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 639px)');

    useEffect(() => {
        setLocalFilters(currentFilters);
    }, [currentFilters]);

    useEffect(() => {
        if (isMobile) return; // Popover-specific logic

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
    }, [isOpen, isMobile]);

    const handleChange = (id: string, value: string) => {
        setLocalFilters(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-box-dark py-2 px-4 font-medium text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2"
            >
                <FilterIcon className="w-5 h-5" />
                <span>Filter</span>
            </button>
            
            {isOpen && (
                isMobile ? (
                    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Filter Options" size="sm">
                        <FilterFormContent
                            filterOptions={filterOptions}
                            localFilters={localFilters}
                            onLocalFilterChange={handleChange}
                            onApply={onApply}
                            onClear={onClear}
                            onClose={() => setIsOpen(false)}
                        />
                    </Modal>
                ) : (
                    <div
                        ref={popoverRef}
                        className="absolute top-full right-0 mt-2 w-80 rounded-lg border border-stroke bg-white dark:bg-box-dark shadow-lg z-10 p-4"
                    >
                         <FilterFormContent
                            filterOptions={filterOptions}
                            localFilters={localFilters}
                            onLocalFilterChange={handleChange}
                            onApply={onApply}
                            onClear={onClear}
                            onClose={() => setIsOpen(false)}
                        />
                    </div>
                )
            )}
        </div>
    );
};

export default AdvancedFilter;