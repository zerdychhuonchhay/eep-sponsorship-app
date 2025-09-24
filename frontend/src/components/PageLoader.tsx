import React from 'react';

const PageLoader: React.FC = () => {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
    );
};

export default PageLoader;