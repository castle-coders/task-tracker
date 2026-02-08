import React, { useState, useEffect } from 'react';
import type { Task, Category, Priority, User } from '../types';
import api from '../api/client';
import ReactMarkdown from 'react-markdown';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task?: Task | null;
    onSave: () => void;
    onDelete?: (id: number) => void;
}

export default function TaskModal({ isOpen, onClose, task, onSave, onDelete }: TaskModalProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
    const [categories, setCategories] = useState<Category[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [priorityId, setPriorityId] = useState<number | ''>('');
    const [assigneeId, setAssigneeId] = useState<number | ''>('');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchReferences();
            if (task) {
                // Existing task - start in view mode
                setIsEditMode(false);
                setTitle(task.title);
                setDescription(task.description || '');
                setStatus(task.status);
                setCategoryId(task.category?.id || '');
                setPriorityId(task.priority?.id || '');
                setAssigneeId(task.assignee?.id || '');
                setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
            } else {
                // New task - start in edit mode
                setIsEditMode(true);
                setTitle('');
                setDescription('');
                setStatus('todo');
                setCategoryId('');
                setPriorityId('');
                setAssigneeId('');
                setDueDate('');
            }
        }
    }, [isOpen, task]);

    const fetchReferences = async () => {
        try {
            const [catRes, priRes, userRes] = await Promise.all([
                api.get('/categories'),
                api.get('/priorities'),
                api.get('/auth/users')
            ]);
            setCategories(catRes.data);
            setPriorities(priRes.data);
            setUsers(userRes.data);
        } catch (e) {
            console.error("Failed to fetch references", e);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            title,
            description,
            status,
            category_id: categoryId || null,
            priority_id: priorityId || null,
            assignee_id: assigneeId || null,
            due_date: dueDate ? new Date(dueDate).toISOString() : null
        };

        try {
            if (task) {
                await api.put(`/tasks/${task.id}`, payload);
            } else {
                await api.post('/tasks', payload);
            }
            onSave();
            onClose();
        } catch (e) {
            console.error("Failed to save task", e);
        }
    };

    const handleDelete = async () => {
        if (task && task.id && onDelete) {
            if (confirm('Are you sure you want to delete this task?')) {
                onDelete(task.id);
                onClose();
            }
        }
    };

    const handleEdit = () => {
        setIsEditMode(true);
    };

    const handleCancel = () => {
        if (task) {
            // If editing existing task, revert to view mode
            setIsEditMode(false);
            // Reset fields to original values
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setCategoryId(task.category?.id || '');
            setPriorityId(task.priority?.id || '');
            setAssigneeId(task.assignee?.id || '');
            setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
        } else {
            // If creating new task, close modal
            onClose();
        }
    };

    const getCategoryName = () => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'No Category';
    };

    const getPriorityName = () => {
        const priority = priorities.find(p => p.id === priorityId);
        return priority ? priority.name : 'No Priority';
    };

    const getAssigneeName = () => {
        const user = users.find(u => u.id === assigneeId);
        return user ? user.name : 'Unassigned';
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'No due date';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-filter backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 dark:bg-gray-800">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                                {task ? (isEditMode ? 'Edit Task' : 'Task Details') : 'Create New Task'}
                            </h3>
                            {task && !isEditMode && (
                                <button
                                    onClick={handleEdit}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {isEditMode ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                        placeholder="What needs to be done?"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 min-h-[120px] resize-y font-mono"
                                        placeholder="Add details... (supports markdown)"
                                        rows={6}
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Supports Markdown formatting</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['todo', 'in_progress', 'done'].map((s) => (
                                            <div
                                                key={s}
                                                onClick={() => setStatus(s as any)}
                                                className={`cursor-pointer rounded-lg border p-2 text-center text-sm font-medium capitalize transition-all ${status === s
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                    : 'border-gray-200 hover:bg-gray-50 text-gray-600 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {s.replace('_', ' ')}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                        <select
                                            value={categoryId}
                                            onChange={e => setCategoryId(Number(e.target.value) || '')}
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">No Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                        <select
                                            value={priorityId}
                                            onChange={e => setPriorityId(Number(e.target.value) || '')}
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">No Priority</option>
                                            {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                                        <select
                                            value={assigneeId}
                                            onChange={e => setAssigneeId(Number(e.target.value) || '')}
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">Unassigned</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-5 dark:border-gray-700">
                                    <div>
                                        {task && onDelete && (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:ring-red-900"
                                            >
                                                Delete Task
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800"
                                        >
                                            {task ? 'Save Changes' : 'Create Task'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                                    <p className="text-base text-gray-900 dark:text-white">{title}</p>
                                </div>

                                {description && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</label>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <ReactMarkdown>{description}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                        {status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                                        <p className="text-base text-gray-900 dark:text-white">{getCategoryName()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                                        <p className="text-base text-gray-900 dark:text-white">{getPriorityName()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Assignee</label>
                                        <p className="text-base text-gray-900 dark:text-white">{getAssigneeName()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                                        <p className="text-base text-gray-900 dark:text-white">{formatDate(dueDate)}</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-5 dark:border-gray-700">
                                    <div>
                                        {onDelete && (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:ring-red-900"
                                            >
                                                Delete Task
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
