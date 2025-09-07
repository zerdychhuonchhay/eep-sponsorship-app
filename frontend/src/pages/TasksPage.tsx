import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api.ts';
import { Task, TaskStatus, TaskPriority } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable } from '../components/SkeletonLoader.tsx';
import { FormInput, FormSelect, FormTextArea } from '../components/forms/FormControls.tsx';

type TaskFormData = Omit<Task, 'id'>;

const getInitialTaskFormData = (initialData?: Task | null): TaskFormData => {
    return {
        title: initialData?.title || '',
        description: initialData?.description || '',
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        priority: initialData?.priority || TaskPriority.MEDIUM,
        status: initialData?.status || TaskStatus.TO_DO,
    };
};

const TaskForm: React.FC<{ onSave: (task: TaskFormData) => void; onCancel: () => void; initialData?: Task | null }> = ({ onSave, onCancel, initialData }) => {
    const isEdit = !!initialData;
    
    const [formData, setFormData] = useState<TaskFormData>(() => getInitialTaskFormData(initialData));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const confirmationMessage = isEdit 
            ? 'Are you sure you want to save these changes?' 
            : 'Are you sure you want to create this new task?';
        
        if (window.confirm(confirmationMessage)) {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Title" id="title" type="text" name="title" value={formData.title} onChange={handleChange} required />
            <FormTextArea label="Description" id="description" name="description" value={formData.description} onChange={handleChange} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="Due Date" id="dueDate" type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
                <FormSelect label="Priority" id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </FormSelect>
                <FormSelect label="Status" id="status" name="status" value={formData.status} onChange={handleChange}>
                    {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray dark:bg-box-dark-2 hover:opacity-90">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">{isEdit ? 'Update Task' : 'Save Task'}</button>
            </div>
        </form>
    );
};


const TasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [filterStatus, setFilterStatus] = useState<'All' | TaskStatus>('All');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Task; order: 'asc' | 'desc' } | null>({ key: 'dueDate', order: 'asc' });
    const { showToast } = useNotification();

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getTasks();
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
            showToast('Failed to load tasks.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleSaveTask = async (taskData: TaskFormData) => {
        try {
            if (editingTask) { // Update
                await api.updateTask({ ...taskData, id: editingTask.id });
                setEditingTask(null);
                showToast('Task updated successfully!', 'success');
            } else { // Add
                await api.addTask(taskData);
                setIsAdding(false);
                showToast('Task added successfully!', 'success');
            }
            fetchTasks();
        } catch (error: any) {
            showToast(error.message || 'Failed to save task.', 'error');
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

    const handleSort = (key: keyof Task) => {
        let order: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
    };

    const sortedAndFilteredTasks = useMemo(() => {
        let filtered = tasks.filter(t => filterStatus === 'All' || t.status === filterStatus);
        
        if (sortConfig) {
            filtered.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [tasks, filterStatus, sortConfig]);
    
    const priorityColors: Record<TaskPriority, string> = {
        [TaskPriority.HIGH]: 'bg-danger/10 text-danger',
        [TaskPriority.MEDIUM]: 'bg-warning/10 text-warning',
        [TaskPriority.LOW]: 'bg-primary/10 text-primary',
    };
    
    const statusColors: Record<TaskStatus, string> = {
        [TaskStatus.TO_DO]: 'bg-gray-400/20 text-gray-400',
        [TaskStatus.IN_PROGRESS]: 'bg-secondary/20 text-secondary',
        [TaskStatus.DONE]: 'bg-success/20 text-success',
    };

    if (loading) return <SkeletonTable rows={5} cols={5} />;

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <select 
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as any)}
                    className="rounded-lg border-[1.5px] border-stroke bg-gray-2 py-2 px-5 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white"
                >
                    <option value="All">All Statuses</option>
                    {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setIsAdding(true)} className="flex w-full sm:w-auto justify-center items-center bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90">
                    <PlusIcon /> <span className="ml-2">Add Task</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-2 dark:bg-box-dark-2">
                        <tr>
                            <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('title')}>
                                    Task
                                    {sortConfig?.key === 'title' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                            <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('dueDate')}>
                                    Due Date
                                    {sortConfig?.key === 'dueDate' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                </button>
                            </th>
                             <th className="p-4 font-medium text-black dark:text-white">
                                <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort('priority')}>
                                    Priority
                                    {sortConfig?.key === 'priority' && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
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
                        {sortedAndFilteredTasks.map((task, index) => (
                            <tr key={task.id} className={index === sortedAndFilteredTasks.length - 1 ? '' : 'border-b border-stroke dark:border-strokedark'}>
                                <td className="p-4 text-black dark:text-white">
                                    <p className="font-medium">{task.title}</p>
                                    {task.description && <p className="text-sm text-body-color dark:text-gray-400 mt-1 line-clamp-2" title={task.description}>{task.description}</p>}
                                </td>
                                <td className="p-4 text-body-color dark:text-gray-300">{new Date(task.dueDate).toLocaleDateString()}</td>
                                <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[task.priority]}`}>{task.priority}</span></td>
                                <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>{task.status}</span></td>
                                <td className="p-4">
                                    <div className="flex items-center space-x-3.5">
                                        <button onClick={() => setEditingTask(task)} className="hover:text-primary"><EditIcon /></button>
                                        <button onClick={() => handleDeleteTask(task.id)} className="hover:text-danger"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAdding || !!editingTask} onClose={() => { setIsAdding(false); setEditingTask(null); }} title={editingTask ? 'Edit Task' : 'Add New Task'}>
                <TaskForm 
                    key={editingTask ? editingTask.id : 'new-task'}
                    onSave={handleSaveTask}
                    onCancel={() => { setIsAdding(false); setEditingTask(null); }}
                    initialData={editingTask}
                />
            </Modal>
        </div>
    );
};

export default TasksPage;