import React, { useState } from 'react';
import { StudentStatus } from '@/types.ts';
import Button from '@/components/ui/Button.tsx';
import { FormSelect } from '@/components/forms/FormControls.tsx';

interface BulkActionBarProps {
    selectedCount: number;
    onUpdateStatus: (status: StudentStatus) => void;
    onClearSelection: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, onUpdateStatus, onClearSelection }) => {
    const [newStatus, setNewStatus] = useState<StudentStatus>(StudentStatus.ACTIVE);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (selectedCount === 0) {
        return null;
    }

    const handleApply = async () => {
        setIsSubmitting(true);
        await onUpdateStatus(newStatus);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed bottom-0 left-0 lg:left-72 right-0 z-20 bg-white dark:bg-box-dark shadow-[0_-2px_5px_rgba(0,0,0,0.1)] p-4 transition-transform duration-300">
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-black dark:text-white">{selectedCount} student{selectedCount > 1 ? 's' : ''} selected</span>
                    <button onClick={onClearSelection} className="text-primary text-sm hover:underline">Clear selection</button>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="bulk-status" className="text-sm font-medium text-black dark:text-white">Update Status to:</label>
                    <FormSelect
                        id="bulk-status"
                        name="bulk-status"
                        label=""
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as StudentStatus)}
                    >
                        {Object.values(StudentStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </FormSelect>
                    <Button onClick={handleApply} size="sm" isLoading={isSubmitting}>
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BulkActionBar;
