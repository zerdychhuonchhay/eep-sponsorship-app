import React from 'react';
import { Controller } from 'react-hook-form';
import { WellbeingStatus, YesNo } from '../../types.ts';
import CustomSelect from '../ui/Select.tsx'; // Assuming the custom Select is exported as default

interface FormControlProps {
    label: string;
    className?: string;
    children?: React.ReactNode;
}

interface InputProps extends FormControlProps, React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    // FIX: Changed error prop type to 'any' to accommodate react-hook-form error message types.
    error?: any;
}
export const FormInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ id, label, className, error, ...props }, ref) => (
        <div className={className}>
            <label htmlFor={id} className="mb-2 block text-black dark:text-white">{label}</label>
            <input
                id={id}
                ref={ref}
                {...props}
                className={`w-full rounded-lg border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition disabled:cursor-not-allowed disabled:bg-whiter dark:bg-form-input ${
                    error
                        ? 'border-danger focus:border-danger'
                        : 'border-stroke dark:border-form-strokedark focus:border-primary active:border-primary dark:focus:border-primary'
                }`}
            />
            {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </div>
    )
);
FormInput.displayName = 'FormInput';


interface SelectProps extends FormControlProps, React.SelectHTMLAttributes<HTMLSelectElement> {
    id: string;
    // FIX: Changed error prop type to 'any' to accommodate react-hook-form error message types.
    error?: any;
}
export const FormSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ id, label, className, children, error, ...props }, ref) => (
        <div className={className}>
            <label htmlFor={id} className="mb-2 block text-black dark:text-white">{label}</label>
            <select
                id={id}
                ref={ref}
                {...props}
                className={`w-full rounded-lg border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition disabled:cursor-not-allowed disabled:bg-whiter dark:bg-form-input ${
                    error
                        ? 'border-danger focus:border-danger'
                        : 'border-stroke dark:border-form-strokedark focus:border-primary active:border-primary dark:focus:border-primary'
                }`}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </div>
    )
);
FormSelect.displayName = 'FormSelect';

// New ControlledSelect for custom accessible dropdown
interface ControlledSelectProps {
    control: any;
    name: string;
    label: string;
    options: { value: string; label: string }[];
    disabled?: boolean;
    error?: string;
}
export const ControlledSelect: React.FC<ControlledSelectProps> = ({ control, name, label, options, disabled, error }) => (
    <div>
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <CustomSelect
                    label={label}
                    options={options}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                />
            )}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
);


interface TextAreaProps extends FormControlProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    id: string;
    // FIX: Changed error prop type to 'any' to accommodate react-hook-form error message types.
    error?: any;
}
export const FormTextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ id, label, className, error, ...props }, ref) => (
    <div className={className}>
        <label htmlFor={id} className="mb-2 block text-black dark:text-white">{label}</label>
        <textarea
            id={id}
            ref={ref}
            rows={3}
            {...props}
            className={`w-full rounded-lg border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition disabled:cursor-not-allowed disabled:bg-whiter dark:bg-form-input ${
                error
                    ? 'border-danger focus:border-danger'
                    : 'border-stroke dark:border-form-strokedark focus:border-primary active:border-primary dark:focus:border-primary'
            }`}
        ></textarea>
         {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
));
FormTextArea.displayName = 'FormTextArea';

interface CheckboxProps extends Omit<InputProps, 'type'> {}
export const FormCheckbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ id, label, className, error, ...props }, ref) => (
    <div className={className}>
        <label htmlFor={id} className="flex cursor-pointer items-center">
            <div className="relative pt-0.5">
                <input ref={ref} type="checkbox" id={id} className="sr-only" {...props} />
                <div className={`mr-4 flex h-5 w-5 items-center justify-center rounded border ${props.checked ? 'border-primary bg-primary' : 'border-gray-400'}`}>
                    <span className={`h-2.5 w-2.5 rounded-sm ${props.checked && 'bg-white'}`}></span>
                </div>
            </div>
            {label}
        </label>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
));
FormCheckbox.displayName = 'FormCheckbox';

export const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string; useDefaultGrid?: boolean }> = ({ title, children, className, useDefaultGrid = true }) => (
    <div className="rounded-sm border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-box-dark p-4">
        <div className="border-b border-stroke py-2 px-4 dark:border-strokedark mb-4">
            <h3 className="font-medium text-black dark:text-white">{title}</h3>
        </div>
        <div className={`p-4 ${useDefaultGrid ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''} ${className || ''}`}>
            {children}
        </div>
    </div>
);

export const FormSubSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`rounded-sm border border-stroke bg-gray-2 dark:bg-box-dark-2 p-4 md:col-span-2 ${className}`}>
         <h4 className="font-medium text-black dark:text-white mb-3">{title}</h4>
         <div className="space-y-4">
            {children}
         </div>
    </div>
);

interface YesNoNASelectProps extends SelectProps {}
export const YesNoNASelect = React.forwardRef<HTMLSelectElement, YesNoNASelectProps>(
    (props, ref) => (
    <FormSelect {...props} ref={ref}>
        {Object.values(YesNo).map((v: YesNo) => <option key={v} value={v}>{v}</option>)}
    </FormSelect>
));
YesNoNASelect.displayName = 'YesNoNASelect';


interface WellbeingSelectProps extends SelectProps {}
export const WellbeingSelect = React.forwardRef<HTMLSelectElement, WellbeingSelectProps>(
    (props, ref) => (
    <FormSelect {...props} ref={ref}>
        {Object.values(WellbeingStatus).map((v: WellbeingStatus) => <option key={v} value={v}>{v}</option>)}
    </FormSelect>
));
WellbeingSelect.displayName = 'WellbeingSelect';