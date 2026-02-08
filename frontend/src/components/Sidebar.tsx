import { LayoutDashboard, CheckSquare, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
    currentView: 'list' | 'kanban' | 'settings';
    onChangeView: (view: 'list' | 'kanban' | 'settings') => void;
    onLogout: () => void;
}

export default function Sidebar({ currentView, onChangeView, onLogout }: SidebarProps) {
    return (
        <aside className="w-64 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
            <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-700">
                <LayoutDashboard className="h-6 w-6 text-indigo-600 mr-2" />
                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">TaskTracker</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
                <button
                    onClick={() => onChangeView('list')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === 'list'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <CheckSquare className="mr-3 h-5 w-5" />
                    List View
                </button>

                <button
                    onClick={() => onChangeView('kanban')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === 'kanban'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    Kanban Board
                </button>

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => onChangeView('settings')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === 'settings'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <Settings className="mr-3 h-5 w-5" />
                        Settings
                    </button>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
