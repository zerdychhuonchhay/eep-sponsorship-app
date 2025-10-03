import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Task, TaskStatus, TaskPriority } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, TasksIcon, CloudUploadIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable, SkeletonListItem } from '../components/SkeletonLoader.tsx';
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
import PageActions from '@/components/layout/PageActions.tsx';
import { usePaginatedData } from '@/hooks/usePaginatedData.ts';
import DataWrapper from '@/components/DataWrapper.tsx';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import MobileListItem from '@/components/ui/MobileListItem.tsx';
import Drawer from '@/components/ui/Drawer.tsx';
import { useOffline } from '@/contexts/OfflineContext.tsx';

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
    const [isApiSubmitting, setIsApiSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { showToast } = useNotification();
    const { canCreate, canUpdate, canDelete } = usePermissions('tasks');
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [tasks, setTasks] = useState<Task[]>([]);
    const { isOnline, queueChange } = useOffline();

    const {
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<Task>({
        initialSortConfig: { key: 'dueDate', order: 'asc' },
        initialFilters: { status: '', priority: '' }
    });
    
    const { 
        data: paginatedData, isLoading, isStale, refetch 
    } = usePaginatedData<Task>({
        fetcher: api.getTasks,
        apiQueryString,
        cacheKeyPrefix: 'tasks',
    });
    
    useEffect(() => {
        if (paginatedData?.results) {
            setTasks(paginatedData.results);
        }
    }, [paginatedData]);

    useEffect(() => {
        const handleSync = (event: Event) => {
            const customEvent = event as CustomEvent;
            const createdMap = customEvent.detail?.created;
    
            if (createdMap && Object.keys(createdMap).length > 0) {
                setTasks(prevList => {
                    let listChanged = false;
                    const newList = prevList.map(task => {
                        if (task.id in createdMap) {
                            listChanged = true;
                            return createdMap[task.id];
                        }
                        return task;
                    });
                    return listChanged ? newList : prevList;
                });
                showToast('Offline task changes synced.', 'success');
            } else {
                showToast('Tasks synced from server.', 'info');
                refetch();
            }
        };
        window.addEventListener('offline-sync-complete', handleSync);
        return () => window.removeEventListener('offline-sync-complete', handleSync);
    }, [refetch, showToast]);

    const filterOptions: FilterOption[] = [
        { id: 'status', label: 'Status', options: Object.values(TaskStatus).map(s => ({ value: s, label: s }))},
        { id: 'priority', label: 'Priority', options: Object.values(TaskPriority).map(p => ({ value: p, label: p }))},
    ];
    
    const closeForm = () => {
        setIsAdding(false);
        setEditingTask(null);
    };

    const handleSaveTask = async (taskData: TaskFormData) => {
        setIsApiSubmitting(true);
        const isEdit = !!editingTask;

        if (!isOnline) {
            if (isEdit && editingTask) {
                const updatedTask = { ...editingTask, ...taskData };
                setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
                await queueChange({ type: 'UPDATE_TASK', payload: updatedTask, timestamp: Date.now() });
                showToast('Offline: Task updated. Will sync when online.', 'info');
            } else {
                const tempId = `temp-${Date.now()}`;
                const newTask: Task = { ...taskData, id: tempId };
                setTasks(prev => [newTask, ...prev].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
                await queueChange({ type: 'CREATE_TASK', payload: newTask, timestamp: Date.now() });
                showToast('Offline: Task created. Will sync when online.', 'info');
            }
            closeForm();
            setIsApiSubmitting(false);
            return;
        }
    
        try {
            if (isEdit && editingTask) {
                await api.updateTask({ ...taskData, id: editingTask.id });
                showToast('Task updated successfully!', 'success');
            } else {
                await api.addTask(taskData);
                showToast('Task added successfully!', 'success');
            }
            closeForm();
            refetch();
        } catch (error: any) {
            showToast(error.message || 'Failed to save task.', 'error');
        } finally {
            setIsApiSubmitting(false);
        }
    };
    
    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        const taskToDelete = tasks.find(t => t.id === taskId);
        if (!taskToDelete) return;

        // Optimistic UI update
        setTasks(prev => prev.filter(t => t.id !== taskId));

        if (!isOnline) {
            await queueChange({ type: 'DELETE_TASK', payload: { id: taskId }, timestamp: Date.now() });
            showToast('Offline: Task will be deleted upon reconnection.', 'info');
            return;
        }

        try {
            await api.deleteTask(taskId);
            showToast('Task deleted.', 'success');
            refetch();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete task.', 'error');
            setTasks(prev => [...prev, taskToDelete].sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())); // Revert
        }
    };
    
    const handleQuickStatusChange = async (taskToUpdate: Task, newStatus: TaskStatus) => {
        const originalTasks = tasks;
        const updatedTask = { ...taskToUpdate, status: newStatus };
        setTasks(tasks.map(task => 
            task.id === taskToUpdate.id ? updatedTask : task
        ));

        if (!isOnline) {
            await queueChange({ type: 'UPDATE_TASK', payload: updatedTask, timestamp: Date.now() });
            showToast(`Offline: Task status updated. Will sync.`, 'info');
            return;
        }

        try {
            await api.updateTask(updatedTask);
            showToast(`Task status updated to ${newStatus}.`, 'success');
        } catch (error: any) {
            showToast(`Failed to update task: ${error.message}`, 'error');
            setTasks(originalTasks);
        }
    };
    
    const statusColors: Record<TaskStatus, string> = {
        [TaskStatus.TO_DO]: 'bg-gray-400/20 text-gray-400',
        [TaskStatus.IN_PROGRESS]: 'bg-secondary/20 text-secondary',
        [TaskStatus.DONE]: 'bg-success/20 text-success',
    };
    
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    const mainContent = isLoading && tasks.length === 0 ? (
        isMobile ? (
            <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonListItem key={i} />)}
            </div>
        ) : <SkeletonTable rows={5} cols={5} />
    ) : (
        <DataWrapper isStale={isStale}>
            {tasks.length > 0 ? (
                isMobile ? (
                    <div className="space-y-3">
                        {tasks.map((task) => {
                            const isPending = task.id.startsWith('temp-');
                            return (
                                <MobileListItem
                                    key={task.id}
                                    icon={<TasksIcon className="w-5 h-5 text-primary" />}
                                    title={
                                        <div className="flex items-center gap-2">
                                            {task.title}
                                            {isPending && <CloudUploadIcon className="w-4 h-4 text-secondary" title="Pending sync" />}
                                        </div>
                                    }
                                    subtitle={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                                    rightContent={<Badge type={task.priority} />}
                                    onClick={canUpdate && !isPending ? () => setEditingTask(task) : undefined}
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
                                    {tasks.map((task) => {
                                        const isPending = task.id.startsWith('temp-');
                                        const actionItems = [];
                                        if (canUpdate && !isPending) {
                                            actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => setEditingTask(task) });
                                        }
                                        if (canDelete) {
                                            actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteTask(task.id), className: 'text-danger' });
                                        }

                                        return (
                                            <tr key={task.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{task.title}</p>
                                                        {isPending && <CloudUploadIcon className="w-4 h-4 text-secondary" title="Pending sync" />}
                                                    </div>
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
                                                        disabled={!canUpdate || isPending}
                                                    >
                                                        {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                                    </select>
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
                <EmptyState title="No Tasks Found" />
            )}
        </DataWrapper>
    );
    
    const formIsOpen = isAdding || !!editingTask;

    const formContent = (
        <TaskForm 
            key={editingTask ? editingTask.id : 'new-task'}
            onSave={handleSaveTask}
            onCancel={closeForm}
            initialData={editingTask}
            isApiSubmitting={isApiSubmitting}
        />
    );

    return (
        <div className="space-y-6">
            <PageHeader title="Tasks">
                {canCreate && (
                    <PageActions>
                        <Button 
                            onClick={() => setIsAdding(true)} 
                            icon={<PlusIcon className="w-5 h-5" />}
                            aria-label="Add Task"
                        >
                            <span className="hidden sm:inline">Add Task</span>
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

            {isMobile ? (
                <Drawer isOpen={formIsOpen} onClose={closeForm} title={editingTask ? 'Edit Task' : 'Add New Task'}>
                    {formContent}
                </Drawer>
            ) : (
                <Modal isOpen={formIsOpen} onClose={closeForm} title={editingTask ? 'Edit Task' : 'Add New Task'}>
                    {formContent}
                </Modal>
            )}
        </div>
    );
};

export default TasksPage;