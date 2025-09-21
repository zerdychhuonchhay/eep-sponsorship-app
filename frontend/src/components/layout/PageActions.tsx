import React, { ReactNode } from 'react';
import ActionDropdown, { ActionItem } from '@/components/ActionDropdown.tsx';

interface PageActionsProps {
    children: ReactNode;
}

// A wrapper component that consistently collapses action buttons
// into a "three-dots" dropdown menu.
const PageActions: React.FC<PageActionsProps> = ({ children }) => {
    // Transform children into items for the ActionDropdown.
    // Use React.Children.map for safety as it handles various child types gracefully.
    const items = React.Children.map(children, (child) => {
        // Ensure the child is a valid element and not a primitive or a native DOM element.
        if (!React.isValidElement(child) || typeof child.type === 'string') {
            return null;
        }

        const props = child.props as { 'aria-label'?: string; icon?: ReactNode; onClick: () => void; variant?: string };
        
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

    return <ActionDropdown items={items} />;
};

export default PageActions;