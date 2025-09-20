import React from 'react';

interface ToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label }) => {
    return (
        <label htmlFor={id} className="flex cursor-pointer select-none items-center">
            {label && <span className="pr-4 text-black dark:text-white">{label}</span>}
            <div className="relative">
                <input
                    id={id}
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className={`block h-8 w-14 rounded-full ${checked ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'}`}></div>
                <div
                    className={`dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                        checked ? 'translate-x-full' : ''
                    }`}
                ></div>
            </div>
        </label>
    );
};

export default ToggleSwitch;