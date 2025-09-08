import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api.ts';
import { Task, TaskStatus, TaskPriority, PaginatedResponse } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, DotsVerticalIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable } from '../components/SkeletonLoader.tsx';
import { FormInput, FormSelect, FormTextArea } from '../components/forms/FormControls.tsx';
import { useTableControls } from '../hooks/useTableControls.ts';
import Pagination from '../components/Pagination.tsx';
import AdvancedFilter, { FilterOption } from '../components/AdvancedFilter.tsx';
import ActiveFiltersDisplay from '../components/ActiveFiltersDisplay.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Button from '@/components/ui/Button.tsx';
import Badge from '@/components/ui/Badge.tsx';
import EmptyState from '@/components/EmptyState.tsx';

type TaskFormData = Omit<Task, 'id'>;

const TaskForm: React.FC<{ 
    onSave: (task: TaskFormData) => void; 
    onCancel: () => void; 
    initialData?: Task | null;
    isSubmitting: boolean;
}> = ({ onSave, onCancel, initialData, isSubmitting }) => {
    const isEdit = !!initialData;
    
    const [formData, setFormData] = useState<TaskFormData>(() => ({
        title: initialData?.title || '',
        description: initialData?.description || '',
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        priority: initialData?.priority || TaskPriority.MEDIUM,
        status: initialData?.status || TaskStatus.TO_DO,
    }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Title" id="title" type="text" name="title" value={formData.title} onChange={handleChange} required />
            <FormTextArea label="Description" id="description" name="description" value={formData.description} onChange={handleChange} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="Due Date" id="dueDate" type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
                <FormSelect label="Priority" id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                    {Object.values(TaskPriority).map((p: string) => <option key={p} value={p}>{p}</option>)}
                </FormSelect>
                <FormSelect label="Status" id="status" name="status" value={formData.status} onChange={handleChange}>
                    {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>{isEdit ? 'Update Task' : 'Save Task'}</Button>
            </div>
        </form>
    );
};


const TasksPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Task> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showToast } = useNotification();

    const {
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<Task>({
        initialSortConfig: { key: 'dueDate', order: 'asc' },
        initialFilters: { status: '', priority: '' }
    });
    
    const filterOptions: FilterOption[] = [
        { id: 'status', label: 'Status', options: Object.values(TaskStatus).map(s => ({ value: s, label: s }))},
        { id: 'priority', label: 'Priority', options: Object.values(TaskPriority).map(p => ({ value: p, label: p }))},
    ];

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getTasks(apiQueryString);
            setPaginatedData(data);
        } catch (error: any) {
            showToast(error.message || 'Failed to load tasks.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSaveTask = async (taskData: TaskFormData) => {
        setIsSubmitting(true);
        try {
            if (editingTask) {
                await api.updateTask({ ...taskData, id: editingTask.id });
                showToast('Task updated successfully!', 'success');
            } else {
                await api.addTask(taskData);
                showToast('Task added successfully!', 'success');
            }
            setEditingTask(null);
            setIsAdding(false);
            fetchTasks();
        } catch (error: any) {
            showToast(error.message || 'Failed to save task.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteTask = async (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await api.deleteTask(taskId);
                showToast('Task deleted.', 'success');
                fetchTasks();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete task.', 'error');
            }
        }
    };
    
    const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
        setPaginatedData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                results: prev.results.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
            };
        });
        
        try {
            await api.updateTask({ ...task, status: newStatus });
            showToast(`Task "${task.title}" status updated to ${newStatus}.`, 'success');
        } catch (error: any) {
            showToast(`Failed to update task: ${error.message}`, 'error');
            fetchTasks(); // Revert on error
        }
    };
    
    const statusColors: Record<TaskStatus, string> = {
        [TaskStatus.TO_DO]: 'bg-gray-400/20 text-gray-400',
        [TaskStatus.IN_PROGRESS]: 'bg-secondary/20 text-secondary',
        [TaskStatus.DONE]: 'bg-success/20 text-success',
    };
    
    const tasks = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    if (loading && !paginatedData) {
        return (
            <>
                <PageHeader title="Tasks" />
                <SkeletonTable rows={5} cols={5} />
            </>
        )
    };

    return (
        <>
            <PageHeader title="Tasks">
                <Button onClick={() => setIsAdding(true)} icon={<PlusIcon />}>
                    Add Task
                </Button>
            </PageHeader>
            <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-md">
                <div className="flex flex-col sm:flex-row justify-start items-center mb-6 gap-4">
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
                                {(['title', 'dueDate', 'priority', 'status'] as (keyof Task)[]).map(key => (
                                    <th key={key} className="py-4 px-4 font-medium text-black dark:text-white">
                                        <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                            {key === 'dueDate' ? 'Due Date' : key.charAt(0).toUpperCase() + key.slice(1)}
                                            {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                        </button>
                                    </th>
                                ))}
                                <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length > 0 ? tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                    <td className="py-5 px-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">
                                        <p className="font-medium">{task.title}</p>
                                        {task.description && <p className="text-sm text-body-color dark:text-gray-400 mt-1 line-clamp-2" title={task.description}>{task.description}</p>}
                                    </td>
                                    <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{new Date(task.dueDate).toLocaleDateString()}</td>
                                    <td className="py-5 px-4 border-b border-stroke dark:border-strokedark"><Badge type={task.priority} /></td>
                                    <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                        <select 
                                            value={task.status} 
                                            onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                                            className={`w-full rounded border-0 bg-transparent py-1 px-2 font-medium outline-none transition text-xs font-semibold ${statusColors[task.status]}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="py-5 px-4 border-b border-stroke dark:border-strokedark text-center">
                                         <div className="relative inline-block" ref={openDropdownId === task.id ? dropdownRef : null}>
                                            <button 
                                                onClick={() => setOpenDropdownId(openDropdownId === task.id ? null : task.id)} 
                                                className="hover:text-primary p-1 rounded-full hover:bg-gray dark:hover:bg-box-dark-2"
                                                aria-label="Actions"
                                            >
                                                <DotsVerticalIcon />
                                            </button>
                                            {openDropdownId === task.id && (
                                                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-box-dark border border-stroke dark:border-strokedark z-10">
                                                    <div className="py-1">
                                                        <button onClick={() => { setEditingTask(task); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                                            <EditIcon /> Edit
                                                        </button>
                                                        <button onClick={() => { handleDeleteTask(task.id); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-gray-2 dark:hover:bg-box-dark-2">
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
                                    <td colSpan={5}>
                                        <EmptyState title="No Tasks Found" />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {tasks.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

                <Modal isOpen={isAdding || !!editingTask} onClose={() => { setIsAdding(false); setEditingTask(null); }} title={editingTask ? 'Edit Task' : 'Add New Task'}>
                    <TaskForm 
                        key={editingTask ? editingTask.id : 'new-task'}
                        onSave={handleSaveTask}
                        onCancel={() => { setIsAdding(false); setEditingTask(null); }}
                        initialData={editingTask}
                        isSubmitting={isSubmitting}
                    />
                </Modal>
            </div>
        </>
    );
};

export default TasksPage;