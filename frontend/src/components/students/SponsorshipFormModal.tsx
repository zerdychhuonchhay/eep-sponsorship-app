import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sponsorship } from '@/types.ts';
import { api } from '@/services/api.ts';
import { useData } from '@/contexts/DataContext.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import Modal from '@/components/Modal.tsx';
import Button from '@/components/ui/Button.tsx';
import { FormInput, FormSelect } from '@/components/forms/FormControls.tsx';

const sponsorshipSchema = z.object({
    sponsor: z.string().min(1, "A sponsor must be selected."),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().optional().nullable(),
});

type SponsorshipFormData = z.infer<typeof sponsorshipSchema>;

interface SponsorshipFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    initialData?: Sponsorship | null;
    onSave: () => void; // Callback to refresh parent data
}

const SponsorshipFormModal: React.FC<SponsorshipFormModalProps> = ({ isOpen, onClose, studentId, initialData, onSave }) => {
    const isEdit = !!initialData;
    const { sponsorLookup } = useData();
    const { showToast } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const { register, handleSubmit, formState: { errors }, reset } = useForm<SponsorshipFormData>({
        resolver: zodResolver(sponsorshipSchema),
        defaultValues: {
            sponsor: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    sponsor: String(initialData.sponsor),
                    startDate: new Date(initialData.startDate).toISOString().split('T')[0],
                    endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
                });
            } else {
                reset({
                    sponsor: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '',
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit: SubmitHandler<SponsorshipFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                student: studentId,
                sponsor: parseInt(data.sponsor, 10),
                endDate: data.endDate || null,
                // Contract status is no longer managed here
            };
            
            if (isEdit && initialData) {
                await api.updateSponsorship(initialData.id, payload);
                showToast('Sponsorship updated successfully!', 'success');
            } else {
                await api.addSponsorship(payload);
                showToast('Sponsorship added successfully!', 'success');
            }
            onSave();
            onClose();
        } catch (error: any) {
            showToast(error.message || 'Failed to save sponsorship.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async () => {
        if (!isEdit || !initialData) return;
        if (!window.confirm("Are you sure you want to remove this sponsorship record?")) return;
        
        setIsDeleting(true);
        try {
            await api.deleteSponsorship(initialData.id);
            showToast('Sponsorship removed.', 'success');
            onSave();
            onClose();
        } catch (error: any) {
            showToast(error.message || 'Failed to remove sponsorship.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Sponsorship' : 'Add Sponsorship'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormSelect label="Sponsor" id="sponsor" {...register('sponsor')} error={errors.sponsor?.message}>
                    <option value="">-- Select a Sponsor --</option>
                    {sponsorLookup.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </FormSelect>
                <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Start Date" id="startDate" type="date" {...register('startDate')} error={errors.startDate?.message} />
                    <FormInput label="End Date (optional)" id="endDate" type="date" {...register('endDate')} error={errors.endDate?.message} />
                </div>
                
                <div className="flex justify-between items-center pt-4">
                    <div>
                        {isEdit && <Button type="button" variant="danger" onClick={handleDelete} isLoading={isDeleting}>Remove Sponsorship</Button>}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmitting}>{isEdit ? 'Update' : 'Save'}</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default SponsorshipFormModal;