import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { api } from '@/services/api.ts';
import { UserIcon } from '@/components/Icons.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
    username: z.string().min(1, 'Username is required.'),
    email: z.string().email('Please enter a valid email address.'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
    oldPassword: z.string().min(1, 'Current password is required.'),
    newPassword1: z.string().min(6, 'New password must be at least 6 characters.'),
    newPassword2: z.string(),
}).refine(data => data.newPassword1 === data.newPassword2, {
    message: "New passwords do not match.",
    path: ['newPassword2'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;


const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { showToast } = useNotification();
    
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, reset: resetProfile } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
    });

    const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }, reset: resetPassword } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        if (user) {
            resetProfile({ username: user.username, email: user.email });
            setPhotoPreview(user.profilePhoto || null);
        }
    }, [user, resetProfile]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onProfileSubmit = async (data: ProfileFormData) => {
        setIsProfileSubmitting(true);
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('email', data.email);
        if (photoFile) {
            formData.append('profile_photo', photoFile);
        }

        try {
            await api.updateUserProfile(formData);
            await refreshUser();
            showToast('Profile updated successfully!', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to update profile.', 'error');
        } finally {
            setIsProfileSubmitting(false);
            setPhotoFile(null);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        setPasswordError('');
        try {
            const response = await api.changePassword(data);
            showToast(response.detail || 'Password changed successfully!', 'success');
            resetPassword({ oldPassword: '', newPassword1: '', newPassword2: '' });
        } catch (error: any) {
            setPasswordError(error.message || 'Failed to change password.');
            showToast(error.message || 'Failed to change password.', 'error');
        }
    };

    if (!user) {
        return <div>Loading user profile...</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="My Profile" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardContent>
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Profile Information</h3>
                        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                            <div className="flex items-center gap-4">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                        <UserIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                                    </div>
                                )}
                                <FormInput
                                    label="Change Profile Photo"
                                    id="profilePhoto"
                                    type="file"
                                    onChange={handlePhotoChange}
                                    accept="image/*"
                                />
                            </div>
                            <FormInput
                                label="Username"
                                id="username"
                                type="text"
                                {...registerProfile('username')}
                                error={profileErrors.username?.message}
                            />
                            <FormInput
                                label="Email"
                                id="email"
                                type="email"
                                {...registerProfile('email')}
                                error={profileErrors.email?.message}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" isLoading={isProfileSubmitting}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Change Password</h3>
                        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormInput
                                label="Current Password"
                                id="oldPassword"
                                type="password"
                                autoComplete="current-password"
                                {...registerPassword('oldPassword')}
                                error={passwordErrors.oldPassword?.message}
                            />
                            <FormInput
                                label="New Password"
                                id="newPassword1"
                                type="password"
                                autoComplete="new-password"
                                {...registerPassword('newPassword1')}
                                error={passwordErrors.newPassword1?.message}
                            />
                            <FormInput
                                label="Confirm New Password"
                                id="newPassword2"
                                type="password"
                                autoComplete="new-password"
                                {...registerPassword('newPassword2')}
                                error={passwordErrors.newPassword2?.message}
                            />
                             {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
                            <div className="flex justify-end">
                                <Button type="submit" isLoading={isPasswordSubmitting}>
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;