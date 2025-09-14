import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sponsor } from '@/types.ts';
import { FormInput } from '@/components/forms/FormControls.tsx';
import Button from '@/components/ui/Button.tsx';
import { sponsorSchema, SponsorFormData } from '@/components/schemas/sponsorSchema.ts';


interface SponsorFormProps {
    onSave: (sponsor: SponsorFormData | (SponsorFormData & { id: string })) => void; 
    onCancel: () => void; 
    initialData?: Sponsor | null;
    isSubmitting: boolean;
}

const SponsorForm: React.FC<SponsorFormProps> = ({ onSave, onCancel, initialData, isSubmitting }) => {
    const isEdit = !!initialData;
    
    const { register, handleSubmit, formState: { errors } } = useForm<SponsorFormData>({
        resolver: zodResolver(sponsorSchema),
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            sponsorshipStartDate: initialData ? new Date(initialData.sponsorshipStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        }
    });

    const onSubmit = (data: SponsorFormData) => {
        onSave(isEdit && initialData ? { ...data, id: initialData.id } : data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput 
                label="Sponsor Name" 
                id="name" 
                type="text" 
                placeholder="Full name of the sponsor" 
                {...register('name')}
                required
                error={errors.name?.message}
            />
            <FormInput 
                label="Email" 
                id="email" 
                type="email" 
                placeholder="sponsor@example.com"
                {...register('email')}
                required
                error={errors.email?.message}
            />
            <FormInput 
                label="Sponsorship Start Date" 
                id="sponsorshipStartDate" 
                type="date" 
                {...register('sponsorshipStartDate')}
                required
                error={errors.sponsorshipStartDate?.message}
            />
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>{isEdit ? 'Update Sponsor' : 'Save Sponsor'}</Button>
            </div>
        </form>
    );
};

export default SponsorForm;