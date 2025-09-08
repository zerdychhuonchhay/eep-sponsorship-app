import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api.ts';
import { Transaction, TransactionType, TRANSACTION_CATEGORIES, PaginatedResponse, StudentLookup } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, EditIcon, TrashIcon, DotsVerticalIcon } from '../components/Icons.tsx';
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

const TransactionForm: React.FC<{ 
    onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void; 
    onCancel: () => void; 
    students: StudentLookup[],
    initialData?: Transaction | null;
    isSubmitting: boolean;
}> = ({ onSave, onCancel, students, initialData, isSubmitting }) => {
    const isEdit = !!initialData;
    
    const [formData, setFormData] = useState(() => {
        if (isEdit && initialData) {
            return { ...initialData, date: new Date(initialData.date).toISOString().split('T')[0] };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            description: '',
            location: '',
            amount: 0,
            type: TransactionType.EXPENSE,
            category: TRANSACTION_CATEGORIES[3], // Default to a common expense
            studentId: ''
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Date" id="date" type="date" name="date" value={formData.date} onChange={handleChange} required />
                <FormSelect label="Type" id="type" name="type" value={formData.type} onChange={handleChange}>
                    {Object.values(TransactionType).map((t: string) => <option key={t} value={t}>{t}</option>)}
                </FormSelect>
                <div className="md:col-span-2">
                    <FormInput label="Description" id="description" type="text" name="description" placeholder="Description of the transaction" value={formData.description} onChange={handleChange} required />
                </div>
                <FormInput label="Location" id="location" type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} />
                <FormInput label="Amount" id="amount" type="number" step="0.01" name="amount" placeholder="0.00" value={formData.amount} onChange={handleChange} required />
                <FormSelect label="Category" id="category" name="category" value={formData.category} onChange={handleChange} required>
                    {TRANSACTION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </FormSelect>
            </div>
            <FormSelect label="Associated Student (Optional)" id="student" name="studentId" value={formData.studentId || ''} onChange={handleChange}>
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
    const [students, setStudents] = useState<StudentLookup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showToast } = useNotification();
    
    const { 
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<Transaction>({
        initialSortConfig: { key: 'date', order: 'desc' },
        initialFilters: { type: '', category: '' }
    });
    
    const filterOptions: FilterOption[] = [
        { id: 'type', label: 'Type', options: Object.values(TransactionType).map(t => ({ value: t, label: t })) },
        { id: 'category', label: 'Category', options: TRANSACTION_CATEGORIES.map(c => ({ value: c, label: c })) }
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [transData, studentsData] = await Promise.all([
                api.getTransactions(apiQueryString), 
                api.getStudentLookup()
            ]);
            setPaginatedData(transData);
            setStudents(studentsData);
        } catch (error: any) {
            showToast(error.message || 'Failed to load transaction data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = async (transaction: Omit<Transaction, 'id'> | Transaction) => {
        setIsSubmitting(true);
        try {
            if ('id' in transaction) {
                await api.updateTransaction(transaction);
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
        <>
            <PageHeader title="Transactions">
                <Button onClick={() => setIsAdding(true)} icon={<PlusIcon />}>
                    Log Transaction
                </Button>
            </PageHeader>
            <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
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
                                {(['date', 'description', 'category', 'type', 'amount'] as (keyof Transaction)[]).map(key => (
                                    <th key={key} className={`py-4 px-4 font-medium text-black dark:text-white ${key === 'amount' ? 'text-right' : ''}`}>
                                        <button className={`flex items-center gap-1 w-full hover:text-primary dark:hover:text-primary transition-colors ${key === 'amount' ? 'justify-end' : ''}`} onClick={() => handleSort(key)}>
                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                        </button>
                                    </th>
                                ))}
                                 <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                    <td className="py-5 px-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="py-5 px-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">{t.description}</td>
                                    <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t.category}</td>
                                    <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                        <Badge type={t.type} />
                                    </td>
                                    <td className={`py-5 px-4 font-medium text-right border-b border-stroke dark:border-strokedark ${t.type === TransactionType.INCOME ? 'text-success' : 'text-danger'}`}>
                                        ${Number(t.amount).toFixed(2)}
                                    </td>
                                    <td className="py-5 px-4 border-b border-stroke dark:border-strokedark text-center">
                                        <div className="relative inline-block" ref={openDropdownId === t.id ? dropdownRef : null}>
                                            <button 
                                                onClick={() => setOpenDropdownId(openDropdownId === t.id ? null : t.id)} 
                                                className="hover:text-primary p-1 rounded-full hover:bg-gray dark:hover:bg-box-dark-2"
                                                aria-label="Actions"
                                            >
                                                <DotsVerticalIcon />
                                            </button>
                                            {openDropdownId === t.id && (
                                                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark z-10">
                                                    <div className="py-1">
                                                        <button onClick={() => { setEditingTransaction(t); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                                            <EditIcon /> Edit
                                                        </button>
                                                        <button onClick={() => { handleDelete(t.id); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                                            <TrashIcon /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
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

                <Modal isOpen={isAdding || !!editingTransaction} onClose={() => { setIsAdding(false); setEditingTransaction(null); }} title={editingTransaction ? 'Edit Transaction' : 'Log a New Transaction'}>
                    <TransactionForm 
                        key={editingTransaction ? editingTransaction.id : 'new-transaction'}
                        onSave={handleSave} 
                        onCancel={() => { setIsAdding(false); setEditingTransaction(null); }} 
                        students={students}
                        initialData={editingTransaction}
                        isSubmitting={isSubmitting}
                    />
                </Modal>
            </div>
        </>
    );
};

export default TransactionsPage;