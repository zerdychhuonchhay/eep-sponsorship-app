import React from 'react';
import { GridViewIcon, TableViewIcon } from '@/components/Icons.tsx';

type ViewMode = 'card' | 'table';

interface ViewToggleProps {
    view: ViewMode;
    onChange: (view: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onChange }) => {
    return (
        <div className="flex items-center rounded-lg bg-gray-2 dark:bg-box-dark-2 p-1">
            <button
                onClick={() => onChange('card')}
                className={`p-1.5 rounded-md transition-colors ${
                    view === 'card' ? 'bg-white dark:bg-box-dark shadow-sm' : 'hover:bg-white/50 dark:hover:bg-box-dark'
                }`}
                aria-pressed={view === 'card'}
                title="Card View"
            >
                <GridViewIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => onChange('table')}
                className={`p-1.5 rounded-md transition-colors ${
                    view === 'table' ? 'bg-white dark:bg-box-dark shadow-sm' : 'hover:bg-white/50 dark:hover:bg-box-dark'
                }`}
                aria-pressed={view === 'table'}
                title="Table View"
            >
                <TableViewIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ViewToggle;