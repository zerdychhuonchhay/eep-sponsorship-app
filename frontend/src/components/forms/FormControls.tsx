import React from 'react';
import { WellbeingStatus, YesNo } from '../../types.ts';

interface FormControlProps {
    label: string;
    className?: string;
    children?: React.ReactNode;
}

interface InputProps extends FormControlProps, React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    name: string;
    error?: string;
}
export const FormInput: React.FC<InputProps> = ({ id, name, label, className, error, ...props }) => (
    <div className={className}>
        <label htmlFor={id} className="mb-2 block text-black dark:text-white">{label}</label>
        <input
            id={id}
            name={name}
            {...props}
            className={`w-full rounded-lg border-[1.5px] bg-transparent py-3 px-5 font-medium outline-none transition disabled:cursor-not-allowed disabled:bg-whiter dark:bg-form-input ${
                error
                    ? 'border-danger focus:border-danger'
                    : 'border-stroke dark:border-form-strokedark focus:border-primary active:border-primary dark:focus:border-primary'
            }`}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
);

interface SelectProps extends FormControlProps, React.SelectHTMLAttributes<HTMLSelectElement> {
    id: string;
    name: string;
}
export const FormSelect: React.FC<SelectProps> = ({ id, name, label, className, children, ...props }) => (
     <div className={className}>
        <label htmlFor={id} className="mb-2 block text-black dark:text-white">{label}</label>
        <select
            id={id}
            name={name}
            {...props}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        >
            {children}
        </select>
    </div>
);

interface TextAreaProps extends FormControlProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    id: string;
    name: string;
}
export const FormTextArea: React.FC<TextAreaProps> = ({ id, name, label, className, ...props }) => (
    <div className={className}>
        <label htmlFor={id} className="mb-2 block text-black dark:text-white">{label}</label>
        <textarea
            id={id}
            name={name}
            rows={3}
            {...props}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        ></textarea>
    </div>
);

interface CheckboxProps extends Omit<InputProps, 'type' | 'error'> {}
export const FormCheckbox: React.FC<CheckboxProps> = ({ id, name, label, className, ...props }) => (
    <div className={className}>
        <label htmlFor={id} className="flex cursor-pointer items-center">
            <div className="relative pt-0.5">
                <input type="checkbox" id={id} name={name} className="sr-only" {...props} />
                <div className={`mr-4 flex h-5 w-5 items-center justify-center rounded border ${props.checked ? 'border-primary bg-primary' : 'border-gray-400'}`}>
                    <span className={`h-2.5 w-2.5 rounded-sm ${props.checked && 'bg-white'}`}></span>
                </div>
            </div>
            {label}
        </label>
    </div>
);

export const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className="rounded-sm border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-box-dark p-4">
        <div className="border-b border-stroke py-2 px-4 dark:border-strokedark mb-4">
            <h3 className="font-medium text-black dark:text-white">{title}</h3>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 ${className}`}>
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
export const YesNoNASelect: React.FC<YesNoNASelectProps> = (props) => (
    <FormSelect {...props}>
        {Object.values(YesNo).map((v: YesNo) => <option key={v} value={v}>{v}</option>)}
    </FormSelect>
);

interface WellbeingSelectProps extends SelectProps {}
export const WellbeingSelect: React.FC<WellbeingSelectProps> = (props) => (
    <FormSelect {...props}>
        {Object.values(WellbeingStatus).map((v: WellbeingStatus) => <option key={v} value={v}>{v}</option>)}
    </FormSelect>
);