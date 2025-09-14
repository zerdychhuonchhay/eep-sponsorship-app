import React, { useEffect } from 'react';
import { Role } from '@/types.ts';
import Modal from './Modal.tsx';
import { FormInput } from './forms/FormControls.tsx';
import Button from './ui/Button.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const roleSchema = z.object({
    name: z.string().min(1, 'Role name is required.'),
});

type RoleFormData = z.infer<typeof roleSchema>;

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
    
    const { register, handleSubmit, formState: { errors }, reset } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
    });

    useEffect(() => {
        if (isOpen) {
            reset({ name: initialData?.name || '' });
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = (data: RoleFormData) => {
        onSave(data.name);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? `Edit Role: ${initialData.name}` : 'Add New Role'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormInput
                    label="Role Name"
                    id="roleName"
                    type="text"
                    placeholder="e.g., Accountant"
                    {...register('name')}
                    error={errors.name?.message}
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