import React, { useState } from 'react';
import { Sponsor } from '@/types.ts';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';

interface SponsorFormProps {
    onSave: (sponsor: Omit<Sponsor, 'id' | 'sponsoredStudentCount'> | Omit<Sponsor, 'sponsoredStudentCount'>) => void; 
    onCancel: () => void; 
    initialData?: Sponsor | null;
    isSubmitting: boolean;
}

const SponsorForm: React.FC<SponsorFormProps> = ({ onSave, onCancel, initialData, isSubmitting }) => {
    const isEdit = !!initialData;
    
    const [formData, setFormData] = useState(() => {
        if (isEdit && initialData) {
            return { 
                ...initialData, 
                sponsorshipStartDate: new Date(initialData.sponsorshipStartDate).toISOString().split('T')[0] 
            };
        }
        return {
            name: '',
            email: '',
            sponsorshipStartDate: new Date().toISOString().split('T')[0],
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput 
                label="Sponsor Name" 
                id="name" 
                type="text" 
                name="name" 
                placeholder="Full name of the sponsor" 
                value={formData.name} 
                onChange={handleChange} 
                required 
            />
            <FormInput 
                label="Email" 
                id="email" 
                type="email" 
                name="email" 
                placeholder="sponsor@example.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
            />
            <FormInput 
                label="Sponsorship Start Date" 
                id="sponsorshipStartDate" 
                type="date" 
                name="sponsorshipStartDate" 
                value={formData.sponsorshipStartDate} 
                onChange={handleChange} 
                required 
            />
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>{isEdit ? 'Update Sponsor' : 'Save Sponsor'}</Button>
            </div>
        </form>
    );
};

export default SponsorForm;