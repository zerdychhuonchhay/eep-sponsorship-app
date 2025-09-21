import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { Task, TaskStatus, TaskPriority, PaginatedResponse } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons.tsx';
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
import { Card, CardContent } from '@/components/ui/Card.tsx';
import ActionDropdown from '@/components/ActionDropdown.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskFormData } from '@/components/schemas/taskSchema.ts';

const TaskForm: React.FC<{ 
    onSave: (task: TaskFormData) => void; 
    onCancel: () => void; 
    initialData?: Task | null;
    isApiSubmitting: boolean;
}> = ({ onSave, onCancel, initialData, isApiSubmitting }) => {
    const isEdit = !!initialData;
    
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.TO_DO,
        }
    });

    useEffect(() => {
        if (isEdit && initialData) {
            reset({
                ...initialData,
                dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
            });
        }
    }, [isEdit, initialData, reset]);

    const isFormSubmitting = isSubmitting || isApiSubmitting;

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <FormInput label="Title" id="title" type="text" {...register('title')} error={errors.title?.message} />
            <FormTextArea label="Description" id="description" {...register('description')} error={errors.description?.message} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="Due Date" id="dueDate" type="date" {...register('dueDate')} error={errors.dueDate?.message} />
                <FormSelect label="Priority" id="priority" {...register('priority')} error={errors.priority?.message}>
                    {Object.values(TaskPriority).map((p: string) => <option key={p} value={p}>{p}</option>)}
                </FormSelect>
                <FormSelect label="Status" id="status" {...register('status')} error={errors.status?.message}>
                    {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isFormSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isFormSubmitting}>{isEdit ? 'Update Task' : 'Save Task'}</Button>
            </div>
        </form>
    );
};


const TasksPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Task> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isApiSubmitting, setIsApiSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { showToast } = useNotification();
    const { canCreate, canUpdate, canDelete } = usePermissions('tasks');

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
    
    const handleSaveTask = async (taskData: TaskFormData) => {
        setIsApiSubmitting(true);
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
            setIsApiSubmitting(false);
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

    return (
        <div className="space-y-6">
            <PageHeader title="Tasks">
                {canCreate && (
                    <Button 
                        onClick={() => setIsAdding(true)} 
                        icon={<PlusIcon className="w-5 h-5" />}
                        aria-label="Add Task"
                    >
                        <span className="hidden sm:inline">Add Task</span>
                    </Button>
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
                    {loading ? (
                        <SkeletonTable rows={5} cols={5} />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            {(['title', 'dueDate', 'priority', 'status'] as (keyof Task)[]).map(key => (
                                                <th key={key}>
                                                    <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                                        {key === 'dueDate' ? 'Due Date' : key.charAt(0).toUpperCase() + key.slice(1)}
                                                        {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                    </button>
                                                </th>
                                            ))}
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.length > 0 ? tasks.map((task) => {
                                            const actionItems = [];
                                            if (canUpdate) {
                                                actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => setEditingTask(task) });
                                            }
                                            if (canDelete) {
                                                actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteTask(task.id), className: 'text-danger' });
                                            }

                                            return (
                                                <tr key={task.id}>
                                                    <td>
                                                        <p className="font-medium">{task.title}</p>
                                                        {task.description && <p className="text-sm text-body-color mt-1 line-clamp-2" title={task.description}>{task.description}</p>}
                                                    </td>
                                                    <td className="text-body-color">{new Date(task.dueDate).toLocaleDateString()}</td>
                                                    <td><Badge type={task.priority} /></td>
                                                    <td>
                                                        <select 
                                                            value={task.status} 
                                                            onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                                                            className={`w-full rounded border-0 bg-transparent py-1 px-2 font-medium outline-none transition text-xs font-semibold ${statusColors[task.status]}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            disabled={!canUpdate}
                                                        >
                                                            {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="text-center">
                                                        {actionItems.length > 0 && <ActionDropdown items={actionItems} />}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
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
                        </>
                    )}
                </CardContent>
            </Card>

            <Modal isOpen={isAdding || !!editingTask} onClose={() => { setIsAdding(false); setEditingTask(null); }} title={editingTask ? 'Edit Task' : 'Add New Task'}>
                <TaskForm 
                    key={editingTask ? editingTask.id : 'new-task'}
                    onSave={handleSaveTask}
                    onCancel={() => { setIsAdding(false); setEditingTask(null); }}
                    initialData={editingTask}
                    isApiSubmitting={isApiSubmitting}
                />
            </Modal>
        </div>
    );
};

export default TasksPage;