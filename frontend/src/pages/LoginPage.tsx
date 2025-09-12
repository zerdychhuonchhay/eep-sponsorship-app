import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Invalid email or password.');
        } finally {
            setIsSubmitting(false);
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormInput
                        label="Email or Username"
                        id="email"
                        name="email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                        placeholder='Enter your email or username'
                    />
                    <FormInput
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder='Enter your password'
                    />
                    {error && <p className="text-sm text-danger text-center">{error}</p>}
                    <div>
                        <Button type="submit" isLoading={isSubmitting} className="w-full">
                            Sign In
                        </Button>
                    </div>
                </form>
                <div className="text-sm text-center text-body-color dark:text-gray-300 space-x-4">
                    <NavLink to="/forgot-password" className="font-medium text-primary hover:underline">
                        Forgot Password?
                    </NavLink>
                    <span>|</span>
                     <NavLink to="/signup" className="font-medium text-primary hover:underline">
                        Don't have an account? Sign Up
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;