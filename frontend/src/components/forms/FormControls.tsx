import React from 'react';
import { YesNo, WellbeingStatus } from '../../types.ts';

export const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-black dark:text-white mb-1">{label}</label>
        <input {...props} className="w-full rounded border-[1.5px] border-stroke bg-gray-2 py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary text-black placeholder:text-gray-600 dark:border-strokedark dark:bg-form-input dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary" />
    </div>
);

export const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }> = ({ label, children, ...props }) => (
     <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-black dark:text-white mb-1">{label}</label>
        <select {...props} className="w-full rounded border-[1.5px] border-stroke bg-gray-2 py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary">
            {children}
        </select>
    </div>
);

export const FormTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
     <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-black dark:text-white mb-1">{label}</label>
        <textarea {...props} className="w-full rounded border-[1.5px] border-stroke bg-gray-2 py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary text-black placeholder:text-gray-600 dark:border-strokedark dark:bg-form-input dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary min-h-[100px]" />
    </div>
);

export const FormCheckbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="flex items-center gap-3">
        <input type="checkbox" {...props} id={props.id || props.name} className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-form-input" />
        <label htmlFor={props.id || props.name} className="font-medium text-black dark:text-white">{label}</label>
    </div>
);

export const FormSection: React.FC<{ title: string, children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className="pt-4">
        <h4 className="text-lg font-semibold text-black dark:text-white mb-3 border-b border-stroke dark:border-strokedark pb-2">{title}</h4>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            {children}
        </div>
    </div>
);

export const FormSubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="md:col-span-2">
        <h5 className="text-md font-medium text-black dark:text-white mb-2">{title}</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
);

export const YesNoNASelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, ...props }) => (
    <FormSelect label={label} {...props}>
        {Object.values(YesNo).map(v => <option key={v} value={v}>{v}</option>)}
    </FormSelect>
);

export const WellbeingSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, ...props }) => (
    <FormSelect label={label} {...props}>
        {Object.values(WellbeingStatus).map(v => <option key={v} value={v}>{v}</option>)}
    </FormSelect>
);