import React, { useState } from 'react';
import { AppUser, UserStatus } from '@/types.ts';
import { FormInput, FormSelect } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { useData } from '@/contexts/DataContext.tsx';

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
    
    const [email, setEmail] = useState('');
    // Default to the first available role if not editing, or the user's current role
    const [role, setRole] = useState<string>(user?.role || (roles.length > 0 ? roles[0].name : ''));
    const [status, setStatus] = useState<UserStatus>(user?.status || UserStatus.ACTIVE);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && user) {
            onUpdate(user.id, { role, status });
        } else {
            onInvite(email, role);
        }
    };

    const availableRoles = roles.filter(r => r.name !== 'Administrator');

    return (
        <div>
             <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
                {isEdit ? `Edit User: ${user.username}` : 'Invite New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Email Address"
                    id="email"
                    name="email"
                    type="email"
                    value={isEdit ? user.email : email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isEdit}
                    placeholder="user@extremelove.com"
                />
                <div>
                    <FormSelect
                        label="Assign Role"
                        id="role"
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isEditingSelf || isSubmitting}
                    >
                        {availableRoles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </FormSelect>
                    {isEditingSelf && <p className="text-xs text-body-color mt-1">You cannot change your own role.</p>}
                </div>
                 {isEdit && (
                    <div>
                        <FormSelect
                            label="Status"
                            id="status"
                            name="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as UserStatus)}
                            disabled={isEditingSelf || isSubmitting}
                        >
                            {Object.values(UserStatus).map((s: UserStatus) => <option key={s} value={s}>{s}</option>)}
                        </FormSelect>
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