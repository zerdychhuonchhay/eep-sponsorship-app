import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppUser, UserStatus } from '@/types.ts';
import { FormInput, ControlledSelect } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import { userSchema, UserFormData } from '@/schemas/userSchema.ts';

interface UserFormProps {
    user?: AppUser | null;
    currentUserId?: number;
    onInvite: (email: string, role: string) => void;
    onUpdate: (userId: number, data: { role: string, status: UserStatus }) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, currentUserId, onInvite, onUpdate, onCancel, isSubmitting }) => {
    const isEdit = !!user;
    const isEditingSelf = isEdit && user.id === currentUserId;
    const { roles } = useData();

    const availableRoles = roles.filter(r => r.name !== 'Administrator');
    const roleOptions = availableRoles.map(r => ({ value: r.name, label: r.name }));
    const statusOptions = Object.values(UserStatus).map(s => ({ value: s, label: s }));

    const { register, handleSubmit, control, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema(isEdit)),
        defaultValues: {
            email: user?.email || '',
            role: user?.role || (roleOptions.length > 0 ? roleOptions[0].value : ''),
            status: user?.status || UserStatus.ACTIVE,
        }
    });

    const onSubmit = (data: UserFormData) => {
        if (isEdit && user) {
            onUpdate(user.id, { role: data.role, status: data.status as UserStatus });
        } else {
            onInvite(data.email, data.role);
        }
    };

    return (
        <div>
             <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
                {isEdit ? `Edit User: ${user.username}` : 'Invite New User'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormInput
                    label="Email Address"
                    id="email"
                    type="email"
                    {...register('email')}
                    required
                    disabled={isEdit}
                    placeholder="user@extremelove.com"
                    error={errors.email?.message as string}
                />
                <div>
                    <ControlledSelect
                        label="Assign Role"
                        control={control}
                        name="role"
                        options={roleOptions}
                        disabled={isEditingSelf || isSubmitting}
                        error={errors.role?.message as string}
                    />
                    {isEditingSelf && <p className="text-xs text-body-color mt-1">You cannot change your own role.</p>}
                </div>
                 {isEdit && (
                    <div>
                        <ControlledSelect
                            label="Status"
                            control={control}
                            name="status"
                            options={statusOptions}
                            disabled={isEditingSelf || isSubmitting}
                            error={errors.status?.message as string}
                        />
                        {isEditingSelf && <p className="text-xs text-body-color mt-1">You cannot change your own status.</p>}
                    </div>
                 )}

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {isEdit ? 'Update User' : 'Send Invitation'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;
