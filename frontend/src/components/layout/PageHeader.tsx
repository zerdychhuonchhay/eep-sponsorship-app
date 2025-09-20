import React from 'react';
import useBreadcrumbs from '@/hooks/useBreadcrumbs.ts';
import { NavLink } from 'react-router-dom';
import { ChevronRightIcon } from '@/components/Icons.tsx';

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
    const breadcrumbs = useBreadcrumbs();
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-2xl font-semibold text-black dark:text-white">{title}</h2>
                <nav>
                    <ol className="flex items-center gap-2">
                        <li>
                            <NavLink to="/" className="font-medium text-primary hover:underline">Dashboard</NavLink>
                        </li>
                        {breadcrumbs.slice(1).map((crumb, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <ChevronRightIcon className="w-4 h-4" />
                                <span
                                    className={`font-medium ${index === breadcrumbs.length - 2 ? 'text-black dark:text-white' : 'text-body-color dark:text-gray-300'}`}
                                >
                                    {crumb.name}
                                </span>
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>
            {children && <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">{children}</div>}
        </div>
    );
};

export default PageHeader;