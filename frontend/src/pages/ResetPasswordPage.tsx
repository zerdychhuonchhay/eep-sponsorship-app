import React, { useState } from 'react';
// FIX: Standardizing react-router-dom imports to named imports, which is the correct syntax for v6.
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetSchema, PasswordResetFormData } from '@/components/schemas/passwordResetSchema.ts';

const ResetPasswordPage: React.FC = () => {
    const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [apiError, setApiError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordResetFormData>({
        resolver: zodResolver(passwordResetSchema),
    });

    const onSubmit = async (data: PasswordResetFormData) => {
        if (!uidb64 || !token) {
            setApiError('Invalid password reset link. Please request a new one.');
            return;
        }
        setApiError('');
        try {
            const response = await api.confirmPasswordReset({
                uidb64,
                token,
                newPassword1: data.newPassword1,
                newPassword2: data.newPassword2,
            });
            showToast(response.message, 'success');
            navigate('/login');
        } catch (err: any) {
            setApiError(err.message || 'Failed to reset password. The link may have expired.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-2 dark:bg-box-dark-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-box-dark rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-black dark:text-white">Set Your New Password</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <FormInput
                        label="New Password"
                        id="newPassword1"
                        type="password"
                        autoComplete="new-password"
                        {...register('newPassword1')}
                        error={errors.newPassword1?.message}
                    />
                    <FormInput
                        label="Confirm New Password"
                        id="newPassword2"
                        type="password"
                        autoComplete="new-password"
                        {...register('newPassword2')}
                        error={errors.newPassword2?.message}
                    />
                    {apiError && <p className="text-sm text-danger text-center">{apiError}</p>}
                    <div>
                        <Button type="submit" isLoading={isSubmitting} className="w-full">
                            Set New Password
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;