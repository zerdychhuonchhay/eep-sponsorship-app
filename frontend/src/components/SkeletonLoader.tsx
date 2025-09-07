import React from 'react';

const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray dark:bg-box-dark-2 rounded-md ${className}`}></div>
);

export const SkeletonCard: React.FC = () => (
    <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark py-6 px-7 shadow-sm">
        <SkeletonLoader className="h-11.5 w-11.5 rounded-full mb-4" />
        <div className="flex items-end justify-between">
            <div>
                <SkeletonLoader className="h-8 w-24 mb-2" />
                <SkeletonLoader className="h-4 w-32" />
            </div>
        </div>
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
    <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <SkeletonLoader className="h-10 w-full sm:w-1/3" />
            <SkeletonLoader className="h-10 w-full sm:w-auto sm:w-36" />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-2 dark:bg-box-dark-2">
                        {[...Array(cols)].map((_, i) => (
                            <th key={i} className="p-4"><SkeletonLoader className="h-5 w-24" /></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(rows)].map((_, i) => (
                        <tr key={i} className="border-b border-stroke dark:border-strokedark">
                            {[...Array(cols)].map((_, j) => (
                                <td key={j} className="p-4">
                                    {j === 0 ? (
                                        <div className="flex items-center gap-3">
                                            <SkeletonLoader className="w-10 h-10 rounded-full" />
                                            <div>
                                                <SkeletonLoader className="h-5 w-32 mb-1" />
                                                <SkeletonLoader className="h-3 w-20" />
                                            </div>
                                        </div>
                                    ) : (
                                        <SkeletonLoader className="h-5 w-20" />
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const SkeletonDashboard: React.FC = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
        <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
            <div className="col-span-12 xl:col-span-8 bg-white dark:bg-box-dark p-6 rounded-lg border border-stroke shadow-sm">
                <SkeletonLoader className="h-8 w-48 mb-4" />
                <SkeletonLoader className="h-[350px] w-full" />
            </div>
            <div className="col-span-12 xl:col-span-4 bg-white dark:bg-box-dark p-6 rounded-lg border border-stroke shadow-sm">
                 <SkeletonLoader className="h-8 w-48 mb-4" />
                 <SkeletonLoader className="h-[350px] w-full" />
            </div>
            <div className="col-span-12">
                <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
                    <SkeletonLoader className="h-8 w-48 mb-4" />
                    <SkeletonLoader className="h-10 w-full mb-2" />
                    <SkeletonLoader className="h-10 w-full mb-2" />
                    <SkeletonLoader className="h-10 w-full mb-2" />
                    <SkeletonLoader className="h-10 w-full mb-2" />
                    <SkeletonLoader className="h-10 w-full" />
                </div>
            </div>
        </div>
    </div>
);
