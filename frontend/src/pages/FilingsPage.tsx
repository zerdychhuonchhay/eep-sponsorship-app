import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { GovernmentFiling, FilingStatus } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, EditIcon, TrashIcon } from '../components/Icons.tsx';
import { SkeletonTable } from '../components/SkeletonLoader.tsx';
import { FormInput, FormSelect } from '../components/forms/FormControls.tsx';
import { useTableControls } from '../hooks/useTableControls.ts';
import Pagination from '../components/Pagination.tsx';
import AdvancedFilter, { FilterOption } from '../components/AdvancedFilter.tsx';
import ActiveFiltersDisplay from '../components/ActiveFiltersDisplay.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Button from '@/components/ui/Button.tsx';
import Badge from '@/components/ui/Badge.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import ActionDropdown from '@/components/ActionDropdown.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { filingSchema, FilingFormData } from '@/components/schemas/filingSchema.ts';
import PageActions from '@/components/layout/PageActions.tsx';
import { usePaginatedData } from '@/hooks/usePaginatedData.ts';
import DataWrapper from '@/components/DataWrapper.tsx';

const FilingForm: React.FC<{ 
    filing?: GovernmentFiling | null; 
    onSave: (filing: any) => void; 
    onCancel: () => void;
    isApiSubmitting: boolean;
}> = ({ filing, onSave, onCancel, isApiSubmitting }) => {
    const isEdit = !!filing;
    const [file, setFile] = useState<File | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<FilingFormData>({
        resolver: zodResolver(filingSchema),
        defaultValues: {
            documentName: '',
            authority: '',
            dueDate: new Date().toISOString().split('T')[0],
            submissionDate: '',
            status: FilingStatus.PENDING,
        }
    });

    const submissionDate = watch('submissionDate');
    const status = watch('status');

    useEffect(() => {
        if (submissionDate && status !== FilingStatus.SUBMITTED) {
            setValue('status', FilingStatus.SUBMITTED);
        } else if (!submissionDate && status !== FilingStatus.PENDING) {
             setValue('status', FilingStatus.PENDING);
        }
    }, [submissionDate, status, setValue]);

    useEffect(() => {
        if (isEdit && filing) {
            reset({
                ...filing,
                dueDate: new Date(filing.dueDate).toISOString().split('T')[0],
                submissionDate: filing.submissionDate ? new Date(filing.submissionDate).toISOString().split('T')[0] : '',
            });
        }
    }, [isEdit, filing, reset]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files) setFile(e.target.files[0]);
    };

    const onSubmit = (data: FilingFormData) => {
        onSave({...data, attached_file: file || filing?.attachedFile });
    };

    const isFormSubmitting = isSubmitting || isApiSubmitting;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput label="Document Name" type="text" id="documentName" {...register('documentName')} error={errors.documentName?.message} />
            <FormInput label="Authority" type="text" id="authority" {...register('authority')} error={errors.authority?.message} />
            <FormInput label="Due Date" type="date" id="dueDate" {...register('dueDate')} error={errors.dueDate?.message} />
            <FormSelect label="Status" id="status" {...register('status')} error={errors.status?.message}>
                {Object.values(FilingStatus).map((s: FilingStatus) => <option key={s} value={s}>{s}</option>)}
            </FormSelect>
            <FormInput label="Submission Date" type="date" id="submissionDate" {...register('submissionDate')} error={errors.submissionDate?.message} />
            <div>
                <FormInput label="Attach File" type="file" id="attached_file" onChange={handleFileChange} />
                {filing?.attachedFile && typeof filing.attachedFile === 'string' && <p className="text-xs mt-1 text-body-color dark:text-gray-300">Current file: {filing.attachedFile}</p>}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isFormSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isFormSubmitting}>{isEdit ? 'Update Filing' : 'Save Filing'}</Button>
            </div>
        </form>
    );
};

const FilingsPage: React.FC = () => {
    const [isApiSubmitting, setIsApiSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedFiling, setSelectedFiling] = useState<GovernmentFiling | null>(null);
    const { showToast } = useNotification();
    const { canCreate, canUpdate, canDelete } = usePermissions('filings');
    
    const {
        sortConfig, currentPage, apiQueryString, filters,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<GovernmentFiling>({
        initialSortConfig: { key: 'dueDate', order: 'asc' },
        initialFilters: { status: '' }
    });

    const { 
        data: paginatedData, isLoading, isStale, refetch 
    } = usePaginatedData<GovernmentFiling>({
        fetcher: api.getFilings,
        apiQueryString,
        currentPage,
    });

    const filterOptions: FilterOption[] = [
        { id: 'status', label: 'Status', options: Object.values(FilingStatus).map(s => ({ value: s, label: s }))}
    ];
    
    const handleSave = async (filingData: GovernmentFiling | Omit<GovernmentFiling, 'id'>) => {
        setIsApiSubmitting(true);
        try {
            if ('id' in filingData) { // Update
                await api.updateFiling(filingData as GovernmentFiling & { attached_file?: File | string });
                showToast('Filing updated successfully!', 'success');
            } else { // Create
                await api.addFiling(filingData as Omit<GovernmentFiling, 'id'> & { attached_file?: File | string });
                showToast('Filing added successfully!', 'success');
            }
            setSelectedFiling(null);
            setIsAdding(false);
            refetch();
        } catch (error: any) {
            showToast(error.message || 'Failed to save filing.', 'error');
        } finally {
            setIsApiSubmitting(false);
        }
    };

    const handleDelete = async (filingId: string) => {
        if (window.confirm('Are you sure you want to delete this filing record? This action cannot be undone.')) {
            try {
                await api.deleteFiling(filingId);
                showToast('Filing deleted successfully.', 'success');
                refetch();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete filing.', 'error');
            }
        }
    };

    const filings = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    return (
        <div className="space-y-6">
            <PageHeader title="Government Filings">
                {canCreate && (
                    <PageActions>
                        <Button 
                            onClick={() => setIsAdding(true)} 
                            icon={<PlusIcon className="w-5 h-5" />}
                            aria-label="New Filing"
                        >
                            <span className="hidden sm:inline">New Filing</span>
                        </Button>
                    </PageActions>
                )}
            </PageHeader>
            
            <Card>
                <CardContent>
                    <div className="p-4 mb-4 rounded-lg bg-gray-2 dark:bg-box-dark-2 border border-stroke dark:border-strokedark">
                        <div className="flex justify-end">
                            <AdvancedFilter
                                filterOptions={filterOptions}
                                currentFilters={filters}
                                onApply={applyFilters}
                                onClear={clearFilters}
                            />
                        </div>
                        <ActiveFiltersDisplay activeFilters={filters} onRemoveFilter={(key) => handleFilterChange(key, '')} />
                    </div>
                    {isLoading ? (
                        <SkeletonTable rows={5} cols={5} />
                    ) : (
                        <DataWrapper isStale={isStale}>
                            {filings.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="ui-table">
                                            <thead>
                                                <tr>
                                                    {(['documentName', 'authority', 'dueDate', 'status'] as (keyof GovernmentFiling)[]).map(key => (
                                                        <th key={key}>
                                                            <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                            </button>
                                                        </th>
                                                    ))}
                                                    <th className="text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filings.map((f) => {
                                                    const actionItems = [];
                                                    if(canUpdate) {
                                                        actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => setSelectedFiling(f) });
                                                    }
                                                    if(canDelete) {
                                                        actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDelete(f.id), className: 'text-danger' });
                                                    }
                                                    return (
                                                        <tr key={f.id}>
                                                            <td className="font-medium">{f.documentName}</td>
                                                            <td className="text-body-color">{f.authority}</td>
                                                            <td className="text-body-color">{new Date(f.dueDate).toLocaleDateString()}</td>
                                                            <td>
                                                                <Badge type={f.status} />
                                                            </td>
                                                            <td className="text-center">
                                                                {actionItems.length > 0 && <ActionDropdown items={actionItems} />}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </>
                            ) : (
                                <EmptyState title="No Filings Found" />
                            )}
                        </DataWrapper>
                    )}
                </CardContent>
            </Card>

            <Modal isOpen={isAdding || !!selectedFiling} onClose={() => { setIsAdding(false); setSelectedFiling(null); }} title={selectedFiling ? 'Update Government Filing' : 'Add New Government Filing'}>
                <FilingForm 
                    key={selectedFiling ? selectedFiling.id : 'new-filing'}
                    filing={selectedFiling} 
                    onSave={handleSave} 
                    onCancel={() => { setIsAdding(false); setSelectedFiling(null); }}
                    isApiSubmitting={isApiSubmitting}
                />
            </Modal>
        </div>
    );
};

export default FilingsPage;
