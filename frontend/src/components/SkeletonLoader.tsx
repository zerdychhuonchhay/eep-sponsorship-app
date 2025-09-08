import React from 'react';

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
    <tr className="border-b border-stroke dark:border-strokedark">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="p-4">
                <div className="h-6 bg-gray-300 dark:bg-box-dark-2 rounded animate-pulse"></div>
            </td>
        ))}
    </tr>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
    <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-2 dark:bg-box-dark-2">
                    <tr>
                        {Array.from({ length: cols }).map((_, i) => (
                            <th key={i} className="p-4"><div className="h-6 bg-gray-400 dark:bg-meta-4 rounded animate-pulse"></div></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
                </tbody>
            </table>
        </div>
    </div>
);

export const SkeletonCard: React.FC = () => (
    <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-box-dark-2 rounded w-3/4 mb-4"></div>
        <div className="h-12 bg-gray-300 dark:bg-box-dark-2 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-box-dark-2 rounded w-full"></div>
    </div>
);
