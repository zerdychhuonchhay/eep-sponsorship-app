import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/layout/PageHeader.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { api } from '@/services/api.ts';
import { UserIcon, CameraIcon } from '@/components/Icons.tsx';
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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

            <Card className="overflow-hidden">
                <div className="relative h-32 md:h-40 bg-gray-2 dark:bg-box-dark-2">
                    {/* Cover photo placeholder */}
                </div>
                <CardContent className="px-4 py-4 sm:px-6">
                    <div className="flex flex-col items-center sm:flex-row sm:items-end sm:space-x-5">
                        <div className="flex-shrink-0 -mt-20 sm:-mt-24">
                            <div className="relative w-32 h-32 rounded-full ring-4 ring-white dark:ring-box-dark group">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <div className="h-full w-full rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                        <UserIcon className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                                    </div>
                                )}
                                <div
                                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                    role="button"
                                    aria-label="Change profile photo"
                                >
                                    <CameraIcon className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 sm:pb-4 flex-1 min-w-0 text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-black dark:text-white truncate">{user.username}</h1>
                            <p className="text-sm font-medium text-body-color">{user.role}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <CardContent>
                            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Profile Information</h3>
                            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                                <input
                                    id="profilePhoto"
                                    type="file"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                    accept="image/*"
                                    ref={fileInputRef}
                                />
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
                                <div className="flex justify-end pt-2">
                                    <Button type="submit" isLoading={isProfileSubmitting}>
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1">
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
                                <div className="flex justify-end pt-2">
                                    <Button type="submit" isLoading={isPasswordSubmitting}>
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;