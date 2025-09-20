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
        
        // FIX: Cast child.props to access properties without TypeScript errors.
        // This is necessary because TypeScript doesn't know the specific props of the children components.
        const props = child.props as { children?: ReactNode, icon?: ReactNode, onClick: () => void, variant?: string };

        // This check ensures we only process components that look like our Button
        if (!props.children) {
            return null;
        }
        return {
            label: props.children,
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