import React, { ReactNode } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import ActionDropdown from '@/components/ActionDropdown.tsx';

interface PageActionsProps {
    children: ReactNode;
}

// A wrapper component that displays action buttons directly on desktop
// but collapses them into a "three-dots" dropdown menu on mobile.
const PageActions: React.FC<PageActionsProps> = ({ children }) => {
    // Tailwind's `sm` breakpoint is 640px. This triggers for screens smaller than that.
    const isMobile = useMediaQuery('(max-width: 639px)');

    if (!isMobile) {
        return <div className="flex items-center gap-2 sm:gap-4">{children}</div>;
    }
    
    // On mobile, transform children into items for the ActionDropdown.
    const items = React.Children.map(children, child => {
        if (!React.isValidElement(child) || typeof child.type === 'string') {
            return null;
        }
        
        const props = child.props as { children?: ReactNode, icon?: ReactNode, onClick: () => void, variant?: string };

        // Ensure we only process buttons with simple string/number labels
        if (typeof props.children !== 'string' && typeof props.children !== 'number') {
            return null;
        }
        
        return {
            label: String(props.children), // Ensure the label is a string
            icon: props.icon,
            onClick: props.onClick,
            className: props.variant === 'danger' ? 'text-danger' : '',
        };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    if (items.length === 0) {
        return null;
    }

    return <div className="ml-auto"><ActionDropdown items={items} /></div>;
};

export default PageActions;
