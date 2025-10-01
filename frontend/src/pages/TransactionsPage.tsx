import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Transaction, TransactionType, StudentLookup } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, EditIcon, TrashIcon, IncomeIcon, ExpenseIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable, SkeletonListItem } from '../components/SkeletonLoader.tsx';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, TransactionFormData } from '@/components/schemas/transaction.ts';
import PageActions from '@/components/layout/PageActions.tsx';
import { usePaginatedData } from '@/hooks/usePaginatedData.ts';
import DataWrapper from '@/components/DataWrapper.tsx';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import MobileListItem from '@/components/ui/MobileListItem.tsx';

const TransactionForm: React.FC<{ 
    onSave: (transaction: TransactionFormData) => void; 
    onCancel: () => void; 
    students: StudentLookup[],
    categories: string[],
    initialData?: Transaction | null;
    isSubmitting: boolean;
}> = ({ onSave, onCancel, students, categories, initialData, isSubmitting: isApiSubmitting }) => {
    const isEdit = !!initialData;
    
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TransactionFormData>({
      resolver: zodResolver(transactionSchema),
      defaultValues: {
        date: new Date().toISOString().split('T')[0],
        description: '',
        location: '',
        amount: 0,
        type: TransactionType.EXPENSE,
        category: categories.length > 3 ? categories[3] : '',
        studentId: ''
      }
    });

    useEffect(() => {
        if (isEdit && initialData) {
            reset({ ...initialData, date: new Date(initialData.date).toISOString().split('T')[0] });
        }
    }, [isEdit, initialData, reset]);

    const isFormSubmitting = isSubmitting || isApiSubmitting;

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Date" id="date" type="date" {...register('date')} error={errors.date?.message} />
                <FormSelect label="Type" id="type" {...register('type')} error={errors.type?.message}>
                    {Object.values(TransactionType).map((t: string) => <option key={t} value={t}>{t}</option>)}
                </FormSelect>
                <div className="md:col-span-2">
                    <FormInput label="Description" id="description" type="text" placeholder="Description of the transaction" {...register('description')} error={errors.description?.message} />
                </div>
                <FormInput label="Location" id="location" type="text" placeholder="Location" {...register('location')} error={errors.location?.message} />
                <FormInput label="Amount" id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
                <FormSelect label="Category" id="category" {...register('category')} error={errors.category?.message}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </FormSelect>
            </div>
            <FormSelect label="Associated Student (Optional)" id="studentId" {...register('studentId')}>
                <option value="">None</option>
                {students.map(s => <option key={s.studentId} value={s.studentId}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
            </FormSelect>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isFormSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isFormSubmitting}>{isEdit ? 'Update Transaction' : 'Save Transaction'}</Button>
            </div>
        </form>
    );
};

const TransactionsPage: React.FC = () => {
    const { studentLookup: students } = useData();
    const [categories, setCategories] = useState<string[]>([]);
    const [isApiSubmitting, setIsApiSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const { showToast } = useNotification();
    const { canCreate, canUpdate, canDelete } = usePermissions('transactions');
    const isMobile = useMediaQuery('(max-width: 767px)');
    
    const { 
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<Transaction>({
        initialSortConfig: { key: 'date', order: 'desc' },
        initialFilters: { type: '', category: '' }
    });
    
    const { 
        data: paginatedData, isLoading, isStale, refetch 
    } = usePaginatedData<Transaction>({
        fetcher: api.getTransactions,
        apiQueryString,
        currentPage,
    });
    
    useEffect(() => {
        api.getTransactionFilterOptions().then(data => setCategories(data.categories));
    }, []);

    const filterOptions: FilterOption[] = [
        { id: 'type', label: 'Type', options: Object.values(TransactionType).map(t => ({ value: t, label: t })) },
        { id: 'category', label: 'Category', options: categories.map(c => ({ value: c, label: c })) }
    ];

    const handleSave = async (transaction: TransactionFormData) => {
        setIsApiSubmitting(true);
        try {
            if (editingTransaction) {
                await api.updateTransaction({ ...transaction, id: editingTransaction.id } as Transaction);
                showToast('Transaction updated successfully!', 'success');
            } else {
                await api.addTransaction(transaction);
                showToast('Transaction logged successfully!', 'success');
            }
            setEditingTransaction(null);
            setIsAdding(false);
            refetch();
        } catch (error: any) {
            showToast(error.message || 'Failed to save transaction.', 'error');
        } finally {
            setIsApiSubmitting(false);
        }
    };
    
    const handleDelete = async (transactionId: string) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await api.deleteTransaction(transactionId);
                showToast('Transaction deleted.', 'success');
                refetch();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete transaction.', 'error');
            }
        }
    };
    
    const transactions = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    const mainContent = isLoading ? (
        isMobile ? (
             <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonListItem key={i} />)}
            </div>
        ) : <SkeletonTable rows={10} cols={6} />
    ) : (
        <DataWrapper isStale={isStale}>
            {transactions.length > 0 ? (
                isMobile ? (
                    <div className="space-y-3">
                         {transactions.map(t => {
                            const student = students.find(s => s.studentId === t.studentId);
                            const subtitle = student ? `${new Date(t.date).toLocaleDateString()} - For: ${student.firstName}` : new Date(t.date).toLocaleDateString();
                            return (
                                <MobileListItem 
                                    key={t.id}
                                    icon={t.type === TransactionType.INCOME ? <IncomeIcon className="h-5 w-5 text-success" /> : <ExpenseIcon className="h-5 w-5 text-danger" />}
                                    title={t.description}
                                    subtitle={subtitle}
                                    rightContent={
                                        <span className={`font-medium ${t.type === TransactionType.INCOME ? 'text-success' : 'text-danger'}`}>
                                            ${Number(t.amount).toFixed(2)}
                                        </span>
                                    }
                                    onClick={canUpdate ? () => setEditingTransaction(t) : undefined}
                                />
                            );
                         })}
                         <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="ui-table">
                                <thead>
                                    <tr>
                                        {(['date', 'description', 'category', 'type', 'amount'] as (keyof Transaction | string)[]).map(key => (
                                            <th key={key as string} className={`${key === 'amount' ? 'text-right' : ''}`}>
                                                <button className={`flex items-center gap-1 w-full hover:text-primary dark:hover:text-primary transition-colors ${key === 'amount' ? 'justify-end' : ''}`} onClick={() => handleSort(key as keyof Transaction)}>
                                                    {String(key).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                </button>
                                            </th>
                                        ))}
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((t) => {
                                        const student = students.find(s => s.studentId === t.studentId);
                                        const actionItems = [];
                                        if (canUpdate) {
                                            actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => setEditingTransaction(t) });
                                        }
                                        if (canDelete) {
                                            actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDelete(t.id), className: 'text-danger' });
                                        }

                                        return (
                                            <tr key={t.id}>
                                                <td>{new Date(t.date).toLocaleDateString()}</td>
                                                <td>
                                                    <p className="font-medium text-black dark:text-white">{t.description}</p>
                                                    {student && (
                                                        <p className="text-sm text-body-color">
                                                            For: {student.firstName} {student.lastName}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="text-body-color">{t.category}</td>
                                                <td>
                                                    <Badge type={t.type} />
                                                </td>
                                                <td className={`font-medium text-right ${t.type === TransactionType.INCOME ? 'text-success' : 'text-danger'}`}>
                                                    ${Number(t.amount).toFixed(2)}
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
                 )
             ) : (
                <EmptyState title="No Transactions Found" />
            )}
        </DataWrapper>
    );

    return (
        <div className="space-y-6">
            <PageHeader title="Transactions">
                {canCreate && (
                    <PageActions>
                        <Button 
                            onClick={() => setIsAdding(true)} 
                            icon={<PlusIcon className="w-5 h-5" />}
                            aria-label="Log Transaction"
                        >
                            <span className="hidden sm:inline">Log Transaction</span>
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
                    {mainContent}
                </CardContent>
            </Card>

            <Modal isOpen={isAdding || !!editingTransaction} onClose={() => { setIsAdding(false); setEditingTransaction(null); }} title={editingTransaction ? 'Edit Transaction' : 'Log a New Transaction'}>
                <TransactionForm 
                    key={editingTransaction ? editingTransaction.id : 'new-transaction'}
                    onSave={handleSave} 
                    onCancel={() => { setIsAdding(false); setEditingTransaction(null); }} 
                    students={students}
                    categories={categories}
                    initialData={editingTransaction}
                    isSubmitting={isApiSubmitting}
                />
            </Modal>
        </div>
    );
};

export default TransactionsPage;