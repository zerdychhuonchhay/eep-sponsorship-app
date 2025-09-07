import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api.ts';
import { GovernmentFiling, FilingStatus } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, EditIcon, TrashIcon } from '../components/Icons.tsx';
import { SkeletonTable } from '../components/SkeletonLoader.tsx';
import { FormInput, FormSelect } from '../components/forms/FormControls.tsx';

const FilingForm: React.FC<{ filing?: GovernmentFiling | null; onSave: (filing: any) => void; onCancel: () => void; }> = ({ filing, onSave, onCancel }) => {
    const isEdit = !!filing;
    
    const [formData, setFormData] = useState(() => {
         return isEdit && filing ? 
            { ...filing, due_date: new Date(filing.due_date).toISOString().split('T')[0], submission_date: filing.submission_date ? new Date(filing.submission_date).toISOString().split('T')[0] : '' } 
            : 
            { document_name: '', authority: '', due_date: new Date().toISOString().split('T')[0], submission_date: '', status: FilingStatus.PENDING, attached_file: undefined };
    });
    const [file, setFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value, 
            status: (name === 'submission_date' && value) || (name === 'status' && value === FilingStatus.SUBMITTED) ? FilingStatus.SUBMITTED : FilingStatus.PENDING 
        }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({...formData, attached_file: file || formData.attached_file });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Document Name" type="text" id="document_name" name="document_name" value={formData.document_name} onChange={handleChange} required />
            <FormInput label="Authority" type="text" id="authority" name="authority" value={formData.authority} onChange={handleChange} required />
            <FormInput label="Due Date" type="date" id="due_date" name="due_date" value={formData.due_date} onChange={handleChange} required />
            <FormSelect label="Status" id="status" name="status" value={formData.status} onChange={handleChange}>
                {Object.values(FilingStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </FormSelect>
            <FormInput label="Submission Date" type="date" id="submission_date" name="submission_date" value={formData.submission_date || ''} onChange={handleChange} />
            <div>
                <FormInput label="Attach File" type="file" id="attached_file" name="attached_file" onChange={handleFileChange} />
                {formData.attached_file && typeof formData.attached_file === 'string' && <p className="text-xs mt-1 text-body-color dark:text-gray-300">Current file: {formData.attached_file}</p>}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray dark:bg-box-dark-2 hover:opacity-90">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">{isEdit ? 'Update Filing' : 'Save Filing'}</button>
            </div>
        </form>
    );
};

const FilingsPage: React.FC = () => {
    const [filings, setFilings] = useState<GovernmentFiling[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedFiling, setSelectedFiling] = useState<GovernmentFiling | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof GovernmentFiling; order: 'asc' | 'desc' } | null>({ key: 'due_date', order: 'asc' });
    const { showToast } = useNotification();
    
    const fetchFilings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFilings();
            setFilings(data);
        } catch (error) {
            console.error("Failed to fetch filings", error);
            showToast('Failed to load filings.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchFilings();
    }, [fetchFilings]);
    
    const handleSort = (key: keyof GovernmentFiling) => {
        let order: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
    };

    const sortedFilings = useMemo(() => {
        let sortableItems = [...filings];
        if (sortConfig !== null) {
            const { key, order } = sortConfig;
            sortableItems.sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];
                
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                if (key === 'due_date' || key === 'submission_date') {
                    const dateA = new Date(aValue as string).getTime();
                    const dateB = new Date(bValue as string).getTime();
                    return (dateA - dateB) * (order === 'asc' ? 1 : -1);
                }
                
                return String(aValue).localeCompare(String(bValue)) * (order === 'asc' ? 1 : -1);
            });
        }
        return sortableItems;
    }, [filings, sortConfig]);

    const handleSave = async (filingData: GovernmentFiling | Omit<GovernmentFiling, 'id'>) => {
        try {
            if ('id' in filingData) { // Update
                await api.updateFiling(filingData);
                setSelectedFiling(null);
                showToast('Filing updated successfully!', 'success');
            } else { // Create
                await api.addFiling(filingData);
                setIsAdding(false);
                showToast('Filing added successfully!', 'success');
            }
            fetchFilings();
        } catch (error) {
            console.error('Failed to save filing', error);
            showToast('Failed to save filing.', 'error');
        }
    };

    const handleDelete = async (filingId: string) => {
        if (window.confirm('Are you sure you want to delete this filing record? This action cannot be undone.')) {
            try {
                await api.deleteFiling(filingId);
                showToast('Filing deleted successfully.', 'success');
                fetchFilings();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete filing.', 'error');
            }
        }
    };

    if (loading) return <SkeletonTable rows={5} cols={5} />;

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-black dark:text-white">Government Filings</h3>
                <button onClick={() => setIsAdding(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90">
                    <PlusIcon /> <span className="ml-2">New Filing</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-2 dark:bg-box-dark-2">
                        <tr>
                            <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('document_name')}>
                                    Document Name
                                    {sortConfig?.key === 'document_name' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('authority')}>
                                    Authority
                                    {sortConfig?.key === 'authority' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('due_date')}>
                                    Due Date
                                    {sortConfig?.key === 'due_date' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('status')}>
                                    Status
                                    {sortConfig?.key === 'status' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFilings.map((f, index) => (
                            <tr key={f.id} className={`hover:bg-gray dark:hover:bg-box-dark-2 ${index === sortedFilings.length - 1 ? '' : 'border-b border-stroke dark:border-strokedark'}`}>
                                <td className="p-4 font-medium text-black dark:text-white">{f.document_name}</td>
                                <td className="p-4 text-body-color dark:text-gray-300">{f.authority}</td>
                                <td className="p-4 text-body-color dark:text-gray-300">{new Date(f.due_date).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${f.status === FilingStatus.SUBMITTED ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                        {f.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center space-x-3.5">
                                        <button onClick={() => setSelectedFiling(f)} className="hover:text-primary"><EditIcon /></button>
                                        <button onClick={() => handleDelete(f.id)} className="hover:text-danger"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAdding || !!selectedFiling} onClose={() => { setIsAdding(false); setSelectedFiling(null); }} title={selectedFiling ? 'Update Government Filing' : 'Add New Government Filing'}>
                <FilingForm 
                    key={selectedFiling ? selectedFiling.id : 'new-filing'}
                    filing={selectedFiling} 
                    onSave={handleSave} 
                    onCancel={() => { setIsAdding(false); setSelectedFiling(null); }} 
                />
            </Modal>
        </div>
    );
};

export default FilingsPage;