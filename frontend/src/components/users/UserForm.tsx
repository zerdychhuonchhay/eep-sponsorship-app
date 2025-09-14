import React, { useEffect } from 'react';
import { AppUser, UserStatus } from '@/types.ts';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import Select from '@/components/ui/Select.tsx';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userSchema } from '@/components/schemas/userSchema.ts';

interface UserFormProps {
    user?: AppUser | null;
    currentUserId?: number;
    onInvite: (email: string, role: string) => void;
    onUpdate: (userId: number, data: { role: string, status: UserStatus }) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, currentUserId, onInvite, onUpdate, onCancel, isSubmitting: isApiSubmitting }) => {
    const isEdit = !!user;
    const isEditingSelf = isEdit && user.id === currentUserId;
    const { roles } = useData();

    const schema = userSchema(isEdit);
    type UserFormData = z.infer<typeof schema>;

    const { control, handleSubmit, formState: { errors, isSubmitting }, reset, register } = useForm<UserFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: '',
            role: roles.length > 0 ? roles[0].name : '',
            status: UserStatus.ACTIVE,
        }
    });

    useEffect(() => {
        if (isEdit && user) {
            reset({
                email: user.email,
                role: user.role,
                status: user.status,
            });
        }
    }, [isEdit, user, reset]);

    const onSubmit = (data: UserFormData) => {
        if (isEdit && user) {
            onUpdate(user.id, { role: data.role, status: data.status! }); // Status will exist in edit mode
        } else {
            onInvite(data.email, data.role);
        }
    };

    const availableRoles = roles.filter(r => r.name !== 'Administrator');
    const roleOptions = availableRoles.map(r => ({ value: r.name, label: r.name }));
    const statusOptions = Object.values(UserStatus).map(s => ({ value: s, label: s }));
    const isFormSubmitting = isSubmitting || isApiSubmitting;

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
                    disabled={isEdit}
                    placeholder="user@extremelove.com"
                    {...register('email')}
                    error={!isEdit ? errors.email?.message : undefined}
                />
                <div>
                    <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="Assign Role"
                                options={roleOptions}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isEditingSelf || isFormSubmitting}
                            />
                        )}
                    />
                    {isEditingSelf && <p className="text-xs text-body-color mt-1">You cannot change your own role.</p>}
                </div>
                 {isEdit && (
                    <div>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    label="Status"
                                    options={statusOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={isEditingSelf || isFormSubmitting}
                                />
                            )}
                        />
                        {isEditingSelf && <p className="text-xs text-body-color mt-1">You cannot change your own status.</p>}
                    </div>
                 )}

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isFormSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isFormSubmitting}>
                        {isEdit ? 'Update User' : 'Send Invitation'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;