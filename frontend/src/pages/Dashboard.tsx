import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ListView from '../components/ListView';
import KanbanView from '../components/KanbanView';
import Sidebar from '../components/Sidebar';
import SettingsView from '../components/SettingsView';
import TaskModal from '../components/TaskModal';
import api from '../api/client';
import type { Task, Category, Priority, User } from '../types';
import { Plus, Menu, Filter, X, Shield } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [view, setView] = useState<'list' | 'kanban' | 'settings'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Filter State
    const [categories, setCategories] = useState<Category[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('');
    const [dueDateFilter, setDueDateFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchReferences();
    }, [dueDateFilter]);

    const fetchTasks = async () => {
        try {
            const params: any = {};
            if (dueDateFilter) {
                params.due_within_days = dueDateFilter;
            }
            const { data } = await api.get('/tasks', { params });
            setTasks(data);
        } catch (e) {
            console.error(e);
        }
    };

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
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure?')) {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        // Optimistic update
        setTasks(tasks.map(t => t.id === id ? { ...t, status: status as any } : t));
        try {
            await api.put(`/tasks/${id}`, { status });
        } catch (e) {
            fetchTasks(); // Revert on fail
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (statusFilter && task.status !== statusFilter) return false;
        if (priorityFilter && (task.priority?.id !== Number(priorityFilter))) return false;
        if (categoryFilter && (task.category?.id !== Number(categoryFilter))) return false;
        if (assigneeFilter) {
            if (assigneeFilter === 'unassigned') {
                if (task.assignee) return false;
            } else {
                if (task.assignee?.id !== Number(assigneeFilter)) return false;
            }
        }
        return true;
    });

    const clearFilters = () => {
        setStatusFilter('');
        setPriorityFilter('');
        setCategoryFilter('');
        setAssigneeFilter('');
        setDueDateFilter('');
    };

    const hasActiveFilters = statusFilter || priorityFilter || categoryFilter || assigneeFilter || dueDateFilter;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar
                    currentView={view}
                    onChangeView={setView}
                    onLogout={logout}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 h-full">
                        <Sidebar
                            currentView={view}
                            onChangeView={(v) => { setView(v); setIsMobileMenuOpen(false); }}
                            onLogout={logout}
                        />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 mr-2"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            {view === 'list' ? 'My Tasks' : view === 'kanban' ? 'Kanban Board' : 'Settings'}
                        </h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        {view !== 'settings' && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg transition-colors ${showFilters || hasActiveFilters ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                                title="Toggle Filters"
                            >
                                <Filter size={20} />
                            </button>
                        )}
                        {user?.is_admin && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                                title="Admin Panel"
                            >
                                <Shield size={20} />
                            </button>
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                            {user?.name}
                        </span>
                        {view !== 'settings' && (
                            <button
                                onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
                            >
                                <Plus size={18} /> <span className="hidden sm:inline">New Task</span>
                            </button>
                        )}
                    </div>
                </header>

                <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 ${view === 'kanban' ? 'p-0' : 'p-6 sm:p-8'}`}>
                    {/* Filter Bar */}
                    {showFilters && view !== 'settings' && (
                        <div className={`mb-6 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm ${view === 'kanban' ? 'm-4 rounded-xl' : 'rounded-xl'}`}>
                            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                                        <select
                                            value={priorityFilter}
                                            onChange={(e) => setPriorityFilter(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">All Priorities</option>
                                            {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assignee</label>
                                        <select
                                            value={assigneeFilter}
                                            onChange={(e) => setAssigneeFilter(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">All Assignees</option>
                                            <option value="unassigned">Unassigned</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                                        <select
                                            value={dueDateFilter}
                                            onChange={(e) => setDueDateFilter(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">All Tasks</option>
                                            <option value="7">Due This Week</option>
                                            <option value="14">Due in 2 Weeks</option>
                                            <option value="30">Due in 30 Days</option>
                                        </select>
                                    </div>
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 min-w-fit mt-2 sm:mt-0"
                                    >
                                        <X size={16} /> Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={`${view === 'kanban' ? 'h-full' : 'max-w-7xl mx-auto'}`}>
                        {view === 'list' ? (
                            <ListView
                                tasks={filteredTasks}
                                onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }}
                            />
                        ) : view === 'kanban' ? (
                            <KanbanView
                                tasks={filteredTasks}
                                onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }}
                                onUpdateStatus={handleStatusUpdate}
                            />
                        ) : (
                            <SettingsView />
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile Nav Overlay could go here */}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={editingTask}
                onSave={fetchTasks}
                onDelete={handleDelete}
            />
        </div>
    );
}
