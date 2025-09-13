import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api.ts';
import { Transaction, TransactionType, PaginatedResponse, StudentLookup } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, EditIcon, TrashIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
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
import { useData } from '@/contexts/DataContext.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import { transactionSchema, TransactionFormData } from '@/schemas/transactionSchema.ts';

const TransactionForm: React.FC<{ 
    onSave: (transaction: TransactionFormData | (TransactionFormData & { id: string })) => void;
    onCancel: () => void; 
    students: StudentLookup[],
    categories: string[],
    initialData?: Transaction | null;
    isSubmitting: boolean;
}> = ({ onSave, onCancel, students, categories, initialData, isSubmitting }) => {
    const isEdit = !!initialData;

    const { register, handleSubmit, formState: { errors } } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            date: initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: initialData?.description || '',
            location: initialData?.location || '',
            amount: initialData?.amount || undefined,
            type: initialData?.type || TransactionType.EXPENSE,
            category: initialData?.category || (categories.length > 3 ? categories[3] : ''),
            studentId: initialData?.studentId || ''
        }
    });

    const onSubmit = (data: TransactionFormData) => {
        onSave(isEdit && initialData ? { ...data, id: initialData.id } : data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Date" id="date" type="date" {...register('date')} required error={errors.date?.message as string} />
                <FormSelect label="Type" id="type" {...register('type')} error={errors.type?.message as string}>
                    {Object.values(TransactionType).map((t: string) => <option key={t} value={t}>{t}</option>)}
                </FormSelect>
                <div className="md:col-span-2">
                    <FormInput label="Description" id="description" type="text" placeholder="Description of the transaction" {...register('description')} required error={errors.description?.message as string} />
                </div>
                <FormInput label="Location" id="location" type="text" placeholder="Location" {...register('location')} error={errors.location?.message as string} />
                <FormInput label="Amount" id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount')} required error={errors.amount?.message as string} />
                <FormSelect label="Category" id="category" {...register('category')} required error={errors.category?.message as string}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </FormSelect>
            </div>
            <FormSelect label="Associated Student (Optional)" id="studentId" {...register('studentId')} error={errors.studentId?.message as string}>
                <option value="">None</option>
                {students.map(s => <option key={s.studentId} value={s.studentId}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
            </FormSelect>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>{isEdit ? 'Update Transaction' : 'Save Transaction'}</Button>
            </div>
        </form>
    );
};

const TransactionsPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Transaction> | null>(null);
    const { studentLookup: students } = useData();
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const { showToast } = useNotification();
    const { canCreate, canUpdate, canDelete } = usePermissions('transactions');
    
    const { 
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<Transaction>({
        initialSortConfig: { key: 'date', order: 'desc' },
        initialFilters: { type: '', category: '' }
    });
    
    const filterOptions: FilterOption[] = [
        { id: 'type', label: 'Type', options: Object.values(TransactionType).map(t => ({ value: t, label: t })) },
        { id: 'category', label: 'Category', options: categories.map(c => ({ value: c, label: c })) }
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [transData, filterOptionsData] = await Promise.all([
                api.getTransactions(apiQueryString),
                api.getTransactionFilterOptions()
            ]);
            setPaginatedData(transData);
            setCategories(filterOptionsData.categories);
        } catch (error: any) {
            showToast(error.message || 'Failed to load transaction data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (transaction: TransactionFormData | (TransactionFormData & { id: string })) => {
        setIsSubmitting(true);
        try {
            if ('id' in transaction) {
                await api.updateTransaction(transaction as Transaction);
                showToast('Transaction updated successfully!', 'success');
            } else {
                await api.addTransaction(transaction);
                showToast('Transaction logged successfully!', 'success');
            }
            setEditingTransaction(null);
            setIsAdding(false);
            fetchData();
        } catch (error: any) {
            showToast(error.message || 'Failed to save transaction.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (transactionId: string) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await api.deleteTransaction(transactionId);
                showToast('Transaction deleted.', 'success');
                fetchData();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete transaction.', 'error');
            }
        }
    };
    
    const transactions = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    if (loading && !paginatedData) {
        return (
            <>
                <PageHeader title="Transactions" />
                <SkeletonTable rows={10} cols={5} />
            </>
        )
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Transactions">
                {canCreate && (
                    <Button onClick={() => setIsAdding(true)} icon={<PlusIcon className="w-5 h-5" />}>
                        Log Transaction
                    </Button>
                )}
            </PageHeader>
           
            <Card>
                <CardContent>
                     <div className="flex justify-end mb-4">
                        <AdvancedFilter 
                            filterOptions={filterOptions}
                            currentFilters={filters}
                            onApply={applyFilters}
                            onClear={clearFilters}
                        />
                    </div>
                    <ActiveFiltersDisplay activeFilters={filters} onRemoveFilter={(key) => handleFilterChange(key, '')} />
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-2 dark:bg-box-dark-2">
                                    {(['date', 'description', 'category', 'type', 'amount'] as (keyof Transaction | string)[]).map(key => (
                                        <th key={key as string} className={`py-4 px-4 font-medium text-black dark:text-white ${key === 'amount' ? 'text-right' : ''}`}>
                                            <button className={`flex items-center gap-1 w-full hover:text-primary dark:hover:text-primary transition-colors ${key === 'amount' ? 'justify-end' : ''}`} onClick={() => handleSort(key as keyof Transaction)}>
                                                {String(key).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                            </button>
                                        </th>
                                    ))}
                                     <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? transactions.map((t) => {
                                     const actionItems = [];
                                     if(canUpdate) {
                                         actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => setEditingTransaction(t) });
                                     }
                                     if(canDelete) {
                                         actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDelete(t.id), className: 'text-danger' });
                                     }

                                     return (
                                        <tr key={t.id} className="hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                            <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="py-5 px-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">{t.description}</td>
                                            <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t.category}</td>
                                            <td className="py-5 px-4 border-b border-stroke dark:border-strokedark"><Badge type={t.type} /></td>
                                            <td className={`py-5 px-4 text-right font-medium border-b border-stroke dark:border-strokedark ${t.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                                                {t.type === 'Income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                                            </td>
                                            <td className="py-5 px-4 border-b border-stroke dark:border-strokedark text-center">
                                                {actionItems.length > 0 && <ActionDropdown items={actionItems} />}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6}>
                                           <EmptyState title="No Transactions Found" />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {transactions.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </CardContent>
            </Card>

            <Modal isOpen={isAdding || !!editingTransaction} onClose={() => { setIsAdding(false); setEditingTransaction(null); }}>
                <TransactionForm 
                    key={editingTransaction ? editingTransaction.id : 'new-transaction'}
                    onSave={handleSave} 
                    onCancel={() => { setIsAdding(false); setEditingTransaction(null); }}
                    students={students}
                    categories={categories}
                    initialData={editingTransaction}
                    isSubmitting={isSubmitting}
                />
            </Modal>
        </div>
    );
};

export default TransactionsPage;
