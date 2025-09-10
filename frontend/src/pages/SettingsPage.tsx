import React from 'react';
import PageHeader from '@/components/layout/PageHeader.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useTheme } from '@/contexts/ThemeContext.tsx';
import { SunIcon, MoonIcon } from '@/components/Icons.tsx';

const SettingsPage: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <PageHeader title="Settings" />
            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Appearance</h3>
                    <p className="text-sm text-body-color dark:text-gray-300 mb-6">
                        Select how you would like the dashboard to appear. This setting will be saved for your next visit.
                    </p>
                    <fieldset>
                        <legend className="sr-only">Theme selection</legend>
                        <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                            <div className="flex items-center">
                                <input
                                    id="light"
                                    name="theme-mode"
                                    type="radio"
                                    checked={theme === 'light'}
                                    onChange={() => setTheme('light')}
                                    className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                                />
                                <label htmlFor="light" className="ml-3 block text-sm font-medium text-black dark:text-white cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <SunIcon /> Light Mode
                                    </div>
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="dark"
                                    name="theme-mode"
                                    type="radio"
                                    checked={theme === 'dark'}
                                    onChange={() => setTheme('dark')}
                                    className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                                />
                                <label htmlFor="dark" className="ml-3 block text-sm font-medium text-black dark:text-white cursor-pointer">
                                     <div className="flex items-center gap-2">
                                        <MoonIcon /> Dark Mode
                                    </div>
                                </label>
                            </div>
                        </div>
                    </fieldset>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
