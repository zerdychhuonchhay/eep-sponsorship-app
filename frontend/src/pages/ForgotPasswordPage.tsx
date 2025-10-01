import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '@/services/api.ts';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
    const [message, setMessage] = useState('');
    
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordSchema>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordSchema) => {
        setMessage('');
        try {
            const response = await api.requestPasswordReset(data.email);
            setMessage(response.message);
        } catch (err: any) {
            // For security, show a generic message even on failure to prevent email enumeration
            setMessage("If an account with this email exists, a password reset link has been sent.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-2 dark:bg-box-dark-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-box-dark rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-black dark:text-white">Reset Your Password</h1>
                    <p className="text-body-color dark:text-gray-300">
                        Enter your email and we'll send you instructions to reset your password.
                    </p>
                </div>

                {message ? (
                    <div className="text-center p-4 bg-success/10 text-success rounded-lg">
                        <p>{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FormInput
                            label="Email"
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            {...register('email')}
                            error={errors.email?.message}
                        />
                        <div>
                            <Button type="submit" isLoading={isSubmitting} className="w-full">
                                Send Reset Link
                            </Button>
                        </div>
                    </form>
                )}

                <div className="text-sm text-center">
                    <ReactRouterDOM.NavLink to="/login" className="font-medium text-primary hover:underline">
                        &larr; Back to Sign In
                    </ReactRouterDOM.NavLink>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;