import React, { ReactNode } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import ActionDropdown, { ActionItem } from '@/components/ActionDropdown.tsx';

interface PageActionsProps {
    children: ReactNode;
}

// A wrapper component that displays action buttons directly on desktop
// but collapses them into a "three-dots" dropdown menu on mobile.
const PageActions: React.FC<PageActionsProps> = ({ children }) => {
    const isMobile = useMediaQuery('(max-width: 639px)');

    if (!isMobile) {
        return <div className="flex items-center gap-2 sm:gap-4">{children}</div>;
    }

    // On mobile, transform children into items for the ActionDropdown.
    // Use React.Children.map for safety as it handles various child types gracefully.
    const items = React.Children.map(children, (child) => {
        // Ensure the child is a valid element and not a primitive or a native DOM element.
        if (!React.isValidElement(child) || typeof child.type === 'string') {
            return null;
        }

        const props = child.props as { 'aria-label'?: string; children?: ReactNode; icon?: ReactNode; onClick: () => void; variant?: string };
        
        // Prioritize aria-label for the dropdown text to support icon-only buttons.
        const label = props['aria-label'];

        if (label) {
            const actionItem: ActionItem = {
                label: label,
                icon: props.icon,
                onClick: props.onClick,
                className: props.variant === 'danger' ? 'text-danger' : '',
            };
            return actionItem;
        }

        return null;
    })?.filter((item): item is ActionItem => item !== null) ?? []; // Filter out nulls and ensure type correctness.


    if (items.length === 0) {
        return null;
    }

    return <div className="ml-auto"><ActionDropdown items={items} /></div>;
};

export default PageActions;