import React, { useState, useEffect } from 'react';
import { Role } from '@/types.ts';
import Modal from './Modal.tsx';
import { FormInput } from './forms/FormControls.tsx';
import Button from './ui/Button.tsx';

interface RoleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    initialData?: Pick<Role, 'id' | 'name'>;
    isSubmitting: boolean;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    isSubmitting,
}) => {
    const isEdit = !!initialData;
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? `Edit Role: ${initialData.name}` : 'Add New Role'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Role Name"
                    id="roleName"
                    name="roleName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Accountant"
                />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {isEdit ? 'Update Role' : 'Save Role'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default RoleFormModal;