import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const DefaultIcon = () => (
    <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l4 4m0-4l-4 4"></path></svg>
);

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "No Results Found", 
  message = "Try adjusting your search or filter criteria.",
  icon = <DefaultIcon />,
  action
}) => {
  return (
    <div className="text-center p-10 border-t border-stroke dark:border-strokedark">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{title}</h3>
      <p className="text-body-color dark:text-gray-400">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;