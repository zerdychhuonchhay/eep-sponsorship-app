import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { api } from '@/services/api.ts';
import { UserIcon } from '@/components/Icons.tsx';

const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { showToast } = useNotification();
    
    // State for profile information
    const [profileData, setProfileData] = useState({ username: '', email: '' });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

    // State for password change
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword1: '',
        newPassword2: '',
    });
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username,
                email: user.email,
            });
            setPhotoPreview(user.profilePhoto || null);
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

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


    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProfileSubmitting(true);
        
        const formData = new FormData();
        formData.append('username', profileData.username);
        formData.append('email', profileData.email);
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

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (passwordData.newPassword1 !== passwordData.newPassword2) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (!passwordData.oldPassword || !passwordData.newPassword1) {
            setPasswordError('All password fields are required.');
            return;
        }

        setIsPasswordSubmitting(true);
        try {
            const response = await api.changePassword(passwordData);
            showToast(response.detail || 'Password changed successfully!', 'success');
            setPasswordData({ oldPassword: '', newPassword1: '', newPassword2: '' });
        } catch (error: any) {
            setPasswordError(error.message || 'Failed to change password.');
            showToast(error.message || 'Failed to change password.', 'error');
        } finally {
            setIsPasswordSubmitting(false);
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
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="flex items-center gap-4">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                        <UserIcon className="w-10 h-10 text-gray-500" />
                                    </div>
                                )}
                                <FormInput
                                    label="Change Profile Photo"
                                    id="profilePhoto"
                                    name="profilePhoto"
                                    type="file"
                                    onChange={handlePhotoChange}
                                    accept="image/*"
                                />
                            </div>
                            <FormInput
                                label="Username"
                                id="username"
                                name="username"
                                type="text"
                                value={profileData.username}
                                onChange={handleProfileChange}
                                required
                            />
                            <FormInput
                                label="Email"
                                id="email"
                                name="email"
                                type="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                required
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
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <FormInput
                                label="Current Password"
                                id="oldPassword"
                                name="oldPassword"
                                type="password"
                                value={passwordData.oldPassword}
                                onChange={handlePasswordChange}
                                required
                                autoComplete="current-password"
                            />
                            <FormInput
                                label="New Password"
                                id="newPassword1"
                                name="newPassword1"
                                type="password"
                                value={passwordData.newPassword1}
                                onChange={handlePasswordChange}
                                required
                                autoComplete="new-password"
                            />
                            <FormInput
                                label="Confirm New Password"
                                id="newPassword2"
                                name="newPassword2"
                                type="password"
                                value={passwordData.newPassword2}
                                onChange={handlePasswordChange}
                                required
                                autoComplete="new-password"
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