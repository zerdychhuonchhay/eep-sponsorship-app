import React, { useState } from 'react';
// FIX: Switched to namespace import for react-router-dom to address module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '@/services/api.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ['confirmPassword'],
});

type SignupSchema = z.infer<typeof signupSchema>;

const SignupPage: React.FC = () => {
    const [apiError, setApiError] = useState('');
    const navigate = ReactRouterDOM.useNavigate();
    const { showToast } = useNotification();
    
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupSchema>({
        resolver: zodResolver(signupSchema)
    });

    const onSubmit = async (data: SignupSchema) => {
        setApiError('');
        try {
            await api.signup(data.username, data.email, data.password);
            showToast('Registration successful! Your account is pending administrator approval.', 'success');
            navigate('/login');
        } catch (err: any) {
            setApiError(err.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-2 dark:bg-box-dark-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-box-dark rounded-lg shadow-md">
                <div className="text-center">
                     <img src="/logo.png" alt="Logo" className="w-20 h-20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-black dark:text-white">Create an Account</h1>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                     <FormInput
                        label="Username"
                        id="username"
                        type="text"
                        autoComplete="username"
                        placeholder="Choose a username"
                        {...register('username')}
                        error={errors.username?.message}
                    />
                    <FormInput
                        label="Email"
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="your-name@extremelove.com"
                        {...register('email')}
                        error={errors.email?.message}
                    />
                    <FormInput
                        label="Password"
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a password"
                        {...register('password')}
                        error={errors.password?.message}
                    />
                     <FormInput
                        label="Confirm Password"
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        {...register('confirmPassword')}
                        error={errors.confirmPassword?.message}
                    />
                    {apiError && <p className="text-sm text-danger text-center">{apiError}</p>}
                    <div>
                        <Button type="submit" isLoading={isSubmitting} className="w-full">
                            Sign Up
                        </Button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <ReactRouterDOM.NavLink to="/login" className="font-medium text-primary hover:underline">
                        Already have an account? Sign In
                    </ReactRouterDOM.NavLink>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;