import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '@/services/api.ts';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsSubmitting(true);
        try {
            const response = await api.forgotPassword(email);
            setMessage(response.message);
        } catch (err: any) {
            // For security, we can show a generic message even on error.
            setMessage("If an account with this email exists, a password reset link has been sent.");
        } finally {
            setIsSubmitting(false);
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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FormInput
                            label="Email"
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="Enter your email"
                        />
                        {error && <p className="text-sm text-danger text-center">{error}</p>}
                        <div>
                            <Button type="submit" isLoading={isSubmitting} className="w-full">
                                Send Reset Link
                            </Button>
                        </div>
                    </form>
                )}

                <div className="text-sm text-center">
                    <NavLink to="/login" className="font-medium text-primary hover:underline">
                        &larr; Back to Sign In
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
