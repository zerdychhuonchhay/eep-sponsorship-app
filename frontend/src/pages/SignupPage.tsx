import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api } from '@/services/api.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';

const SignupPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        try {
            await api.signup(username, email, password);
            showToast('Registration successful! Your account is pending administrator approval.', 'success');
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-2 dark:bg-box-dark-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-box-dark rounded-lg shadow-md">
                <div className="text-center">
                     <img src="/logo.png" alt="Logo" className="w-20 h-20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-black dark:text-white">Create an Account</h1>
                     <p className="text-body-color dark:text-gray-300 mt-2">
                        Registration is restricted to @extremelove.com emails.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                     <FormInput
                        label="Username"
                        id="username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                        placeholder="Choose a username"
                    />
                    <FormInput
                        label="Email"
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="your-name@extremelove.com"
                    />
                    <FormInput
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Create a password"
                    />
                     <FormInput
                        label="Confirm Password"
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                    />
                    {error && <p className="text-sm text-danger text-center">{error}</p>}
                    <div>
                        <Button type="submit" isLoading={isSubmitting} className="w-full">
                            Sign Up
                        </Button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <NavLink to="/login" className="font-medium text-primary hover:underline">
                        Already have an account? Sign In
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;