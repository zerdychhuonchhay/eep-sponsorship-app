import React, { ReactNode } from 'react';
import ActionDropdown, { ActionItem } from '@/components/ActionDropdown.tsx';

interface PageActionsProps {
    children: ReactNode;
}

// A wrapper component that consistently collapses action buttons
// into a "three-dots" dropdown menu.
const PageActions: React.FC<PageActionsProps> = ({ children }) => {
    const items = React.Children.map(children, (child) => {
        if (!React.isValidElement(child) || typeof child.type === 'string') {
            return null;
        }

        // FIX: Cast props to include `children` and then use `props.children` to avoid TypeScript error.
        const props = child.props as { children?: ReactNode, 'aria-label'?: string; icon?: ReactNode; onClick: () => void; variant?: string };
        const label = props['aria-label'] || (typeof props.children === 'string' ? props.children : 'Action');

        if (label) {
            const actionItem: ActionItem = {
                label,
                icon: props.icon,
                onClick: props.onClick,
                className: props.variant === 'danger' ? 'text-danger' : '',
            };
            return actionItem;
        }

        return null;
    })?.filter((item): item is ActionItem => item !== null) ?? [];


    if (items.length === 0) {
        return null;
    }

    return <ActionDropdown items={items} />;
};

export default PageActions;
