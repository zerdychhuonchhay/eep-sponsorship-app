import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api.ts';
import { Transaction, TransactionType, Student, TRANSACTION_CATEGORIES } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, EditIcon, TrashIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable } from '../components/SkeletonLoader.tsx';
import { FormInput, FormSelect } from '../components/forms/FormControls.tsx';

const TransactionForm: React.FC<{ 
    onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void; 
    onCancel: () => void; 
    students: Student[],
    initialData?: Transaction | null;
}> = ({ onSave, onCancel, students, initialData }) => {
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
            student_id: ''
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const confirmationMessage = isEdit 
            ? 'Are you sure you want to save these changes?'
            : 'Are you sure you want to save this transaction?';
        if (window.confirm(confirmationMessage)) {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Date" id="date" type="date" name="date" value={formData.date} onChange={handleChange} required />
                <FormSelect label="Type" id="type" name="type" value={formData.type} onChange={handleChange}>
                    {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
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
            <FormSelect label="Associated Student (Optional)" id="student" name="student_id" value={formData.student_id || ''} onChange={handleChange}>
                <option value="">None</option>
                {students.map(s => <option key={s.student_id} value={s.student_id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}
            </FormSelect>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray dark:bg-box-dark-2 hover:opacity-90">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">{isEdit ? 'Update Transaction' : 'Save Transaction'}</button>
            </div>
        </form>
    );
};

const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [filterType, setFilterType] = useState<'All' | TransactionType>('All');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; order: 'asc' | 'desc' } | null>({ key: 'date', order: 'desc' });
    const { showToast } = useNotification();
    
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const [transData, studentsData] = await Promise.all([api.getTransactions(), api.getStudents()]);
            setTransactions(transData);
            setStudents(studentsData);
        } catch (error) {
            console.error("Failed to fetch data", error);
            showToast('Failed to load transaction data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleSave = async (transaction: Omit<Transaction, 'id'> | Transaction) => {
        try {
            if ('id' in transaction) { // Update
                await api.updateTransaction(transaction);
                setEditingTransaction(null);
                showToast('Transaction updated successfully!', 'success');
            } else { // Create
                await api.addTransaction(transaction);
                setIsAdding(false);
                showToast('Transaction logged successfully!', 'success');
            }
            fetchTransactions();
        } catch (error) {
            console.error('Failed to save transaction', error);
            showToast('Failed to save transaction.', 'error');
        }
    };
    
    const handleDelete = async (transactionId: string) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await api.deleteTransaction(transactionId);
                showToast('Transaction deleted.', 'success');
                fetchTransactions();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete transaction.', 'error');
            }
        }
    };


    const handleSort = (key: keyof Transaction) => {
        let order: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
    };
    
    const sortedAndFilteredTransactions = useMemo(() => {
        const filtered = transactions.filter(t => filterType === 'All' || t.type === filterType);
        
        if (sortConfig !== null) {
            const { key, order } = sortConfig;
            filtered.sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];

                if (aValue == null) return 1;
                if (bValue == null) return -1;
                
                if (key === 'date') {
                    const dateA = new Date(aValue as string).getTime();
                    const dateB = new Date(bValue as string).getTime();
                    return (dateA - dateB) * (order === 'asc' ? 1 : -1);
                }
                
                if (key === 'amount') {
                    return ((aValue as number) - (bValue as number)) * (order === 'asc' ? 1 : -1);
                }

                return String(aValue).localeCompare(String(bValue)) * (order === 'asc' ? 1 : -1);
            });
        }
        
        return filtered;
    }, [transactions, filterType, sortConfig]);

    if (loading) return <SkeletonTable rows={10} cols={5} />;

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as 'All' | TransactionType)}
                        className="rounded-lg border-[1.5px] border-stroke bg-gray-2 py-2 px-5 font-medium outline-none transition focus:border-primary active:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    >
                        <option value="All">All Types</option>
                        <option value={TransactionType.INCOME}>Income</option>
                        <option value={TransactionType.EXPENSE}>Expense</option>
                    </select>
                </div>
                <button onClick={() => setIsAdding(true)} className="flex w-full sm:w-auto justify-center items-center bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90">
                    <PlusIcon /> <span className="ml-2">Log Transaction</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-2 dark:bg-box-dark-2">
                        <tr>
                            <th className="p-4 font-medium text-black dark:text-white">
                                 <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('date')}>
                                    Date
                                    {sortConfig?.key === 'date' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('description')}>
                                    Description
                                    {sortConfig?.key === 'description' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white">
                                 <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('category')}>
                                    Category
                                    {sortConfig?.key === 'category' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('type')}>
                                    Type
                                    {sortConfig?.key === 'type' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white text-right">
                                <button className="flex items-center gap-1 w-full justify-end hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('amount')}>
                                    Amount
                                    {sortConfig?.key === 'amount' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                             <th className="p-4 font-medium text-black dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredTransactions.map((t, index) => (
                            <tr key={t.id} className={index === sortedAndFilteredTransactions.length - 1 ? '' : 'border-b border-stroke dark:border-strokedark'}>
                                <td className="p-4 text-black dark:text-white">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="p-4 text-black dark:text-white">{t.description}</td>
                                <td className="p-4 text-body-color dark:text-gray-300">{t.category}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === TransactionType.INCOME ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                        {t.type}
                                    </span>
                                </td>
                                <td className={`p-4 font-medium text-right ${t.type === TransactionType.INCOME ? 'text-success' : 'text-danger'}`}>
                                    ${t.amount.toFixed(2)}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center space-x-3.5">
                                        <button onClick={() => setEditingTransaction(t)} className="hover:text-primary"><EditIcon /></button>
                                        <button onClick={() => handleDelete(t.id)} className="hover:text-danger"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAdding || !!editingTransaction} onClose={() => { setIsAdding(false); setEditingTransaction(null); }} title={editingTransaction ? 'Edit Transaction' : 'Log a New Transaction'}>
                <TransactionForm 
                    key={editingTransaction ? editingTransaction.id : 'new-transaction'}
                    onSave={handleSave} 
                    onCancel={() => { setIsAdding(false); setEditingTransaction(null); }} 
                    students={students}
                    initialData={editingTransaction}
                />
            </Modal>
        </div>
    );
};

export default TransactionsPage;