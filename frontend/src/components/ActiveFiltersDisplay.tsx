import React from 'react';
import { CloseIcon } from './Icons.tsx';

interface ActiveFiltersDisplayProps {
    activeFilters: Record<string, string>;
    onRemoveFilter: (filterName: string) => void;
    customLabels?: Record<string, (value: string) => string | undefined>;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({ activeFilters, onRemoveFilter, customLabels }) => {
    const activeFilterEntries = Object.entries(activeFilters).filter(([, value]) => value && value !== 'all');
    
    if (activeFilterEntries.length === 0) {
        return null;
    }
    
    const formatLabel = (key: string) => {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getValueLabel = (key: string, value: string) => {
        if (customLabels && customLabels[key]) {
            return customLabels[key](value) || value;
        }
        return value;
    };

    return (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-stroke dark:border-strokedark mt-4">
            <span className="text-sm font-medium text-black dark:text-white">Active Filters:</span>
            {activeFilterEntries.map(([key, value]) => (
                <div key={key} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                    <span>{formatLabel(key)}: {getValueLabel(key, value)}</span>
                    <button onClick={() => onRemoveFilter(key)} className="hover:bg-primary/20 rounded-full p-0.5">
                        <CloseIcon className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ActiveFiltersDisplay;