import React from 'react';

interface BadgeProps {
    type: string;
    className?: string;
}

const badgeStyles: Record<string, string> = {
    // StudentStatus & UserStatus
    'Active': 'bg-success/10 text-success',
    'Inactive': 'bg-gray-400/20 text-gray-400',
    'Pending Qualification': 'bg-warning/10 text-warning',
    // SponsorshipStatus
    'Sponsored': 'bg-primary/10 text-primary',
    'Unsponsored': 'bg-gray-400/20 text-gray-400',
    // TransactionType
    'Income': 'bg-success/10 text-success',
    'Expense': 'bg-danger/10 text-danger',
    // FilingStatus
    'Pending': 'bg-warning/10 text-warning',
    'Submitted': 'bg-success/10 text-success',
    // TaskStatus
    'To Do': 'bg-gray-400/20 text-gray-400',
    'In Progress': 'bg-secondary/20 text-secondary',
    'Done': 'bg-success/20 text-success',
    // TaskPriority
    'High': 'bg-danger/10 text-danger',
    'Medium': 'bg-warning/10 text-warning',
    'Low': 'bg-primary/10 text-primary',
    // AcademicReport Pass/Fail
    'Pass': 'bg-success/10 text-success',
    'Fail': 'bg-danger/10 text-danger',
    // Audit Log Actions
    'CREATE': 'bg-success/10 text-success',
    'UPDATE': 'bg-secondary/10 text-secondary',
    'DELETE': 'bg-danger/10 text-danger',
    // UserRole
    'Administrator': 'bg-danger/10 text-danger',
    'Manager': 'bg-primary/10 text-primary',
    'Viewer': 'bg-gray-400/20 text-gray-400',
};

const Badge: React.FC<BadgeProps> = ({ type, className }) => {
    const style = badgeStyles[type] || 'bg-gray-400/20 text-gray-400';
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style} ${className || ''}`}>
            {type}
        </span>
    );
};

export default Badge;