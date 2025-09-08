import React from 'react';

interface DetailCardProps {
    title: string;
    data: Record<string, any>;
    className?: string;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, data, className }) => (
    <div className={`bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-md p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-black dark:text-white mb-4">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <p className="text-sm text-body-color dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium text-black dark:text-white">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || 'N/A'}</p>
                </div>
            ))}
        </div>
    </div>
);

export default DetailCard;