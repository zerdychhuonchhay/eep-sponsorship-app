import React, { useState } from 'react';
// FIX: Switched to namespace import for react-router-dom to address module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginSchema = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
    const [apiError, setApiError] = useState('');
    const { login } = useAuth();
    
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginSchema) => {
        setApiError('');
        try {
            await login(data.email, data.password);
        } catch (err: any) {
            setApiError(err.message || 'Invalid email or password.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-2 dark:bg-box-dark-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-box-dark rounded-lg shadow-md">
                <div className="text-center">
                    <img src="/logo.png" alt="Logo" className="w-20 h-20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-black dark:text-white">NGO Sponsorship Dashboard</h1>
                    <p className="text-body-color dark:text-gray-300">Please sign in to continue</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <FormInput
                        label="Email or Username"
                        id="email"
                        type="text"
                        autoComplete="username"
                        placeholder='Enter your email or username'
                        {...register('email')}
                        error={errors.email?.message}
                    />
                    <FormInput
                        label="Password"
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder='Enter your password'
                        {...register('password')}
                        error={errors.password?.message}
                    />
                    {apiError && <p className="text-sm text-danger text-center">{apiError}</p>}
                    <div>
                        <Button type="submit" isLoading={isSubmitting} className="w-full">
                            Sign In
                        </Button>
                    </div>
                </form>
                <div className="text-sm text-center text-body-color dark:text-gray-300 space-x-4">
                    <ReactRouterDOM.NavLink to="/forgot-password" className="font-medium text-primary hover:underline">
                        Forgot Password?
                    </ReactRouterDOM.NavLink>
                    <span>|</span>
                     <ReactRouterDOM.NavLink to="/signup" className="font-medium text-primary hover:underline">
                        Don't have an account? Sign Up
                    </ReactRouterDOM.NavLink>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;